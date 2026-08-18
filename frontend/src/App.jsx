import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import StreamViewer from './components/StreamViewer';
import ControlPanel from './components/ControlPanel';
import StatsBar from './components/StatsBar';
import PinLockModal from './components/PinLockModal';
import ToastNotifier, { toast } from './components/ToastNotifier';
import ConnectionInfoPanel from './components/ConnectionInfoPanel';
import AudioVisualizer from './components/AudioVisualizer';

const BACKEND_WS_URL = `ws://${window.location.hostname}:8000/ws/stream`;
const BACKEND_AUDIO_WS_URL = `ws://${window.location.hostname}:8000/ws/audio`;
const BACKEND_API_URL = `http://${window.location.hostname}:8000/api`;

// ─── localStorage helpers ───────────────────────────────────────────────────
const SETTINGS_KEY = 'auraview_settings_v2';

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {}
}

// ─── App Component ──────────────────────────────────────────────────────────
export default function App() {
  const saved = loadSettings();

  // ── Auth & Stream state ──
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    sessionStorage.getItem('auraview_pin_auth') === 'true'
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [currentFrameBlob, setCurrentFrameBlob] = useState(null);
  const [activePin, setActivePin] = useState('----');

  // ── Features state ──
  const [isRemoteControlActive, setIsRemoteControlActive] = useState(false);
  const [isPrivacyModeActive, setIsPrivacyModeActive] = useState(false);
  const [isMjpegMode, setIsMjpegMode] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [fitMode, setFitMode] = useState(saved?.fitMode || 'best_fit');

  // ── Configuration state (restored from localStorage) ──
  const [resolution, setResolution] = useState(saved?.resolution || '720p');
  const [targetFps, setTargetFps] = useState(saved?.targetFps || 30);
  const [quality, setQuality] = useState(saved?.quality || 70);
  const [selectedMonitor, setSelectedMonitor] = useState(saved?.selectedMonitor || 1);
  const [monitors, setMonitors] = useState([
    { id: 1, name: 'Primary Monitor', width: 1920, height: 1080 }
  ]);

  // ── Telemetry state ──
  const [fps, setFps] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [dataRateKb, setDataRateKb] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [streamDurationSec, setStreamDurationSec] = useState(0);
  const [cpuPercent, setCpuPercent] = useState(0);

  // ── Refs ──
  const socketRef = useRef(null);
  const audioSocketRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioSourceNodeRef = useRef(null);
  const nextAudioStartTimeRef = useRef(0);
  const authCallbackRef = useRef(null);
  const frameTimesRef = useRef([]);
  const bytesAccumulatorRef = useRef(0);
  const lastByteCalcTimeRef = useRef(Date.now());
  const timerIntervalRef = useRef(null);
  const lastFrameTimeRef = useRef(Date.now());
  const reconnectTimerRef = useRef(null);
  const cpuPollRef = useRef(null);
  // Always-current PIN ref — avoids stale closure bug in WS auth
  const activePinRef = useRef('----');
  // Toast debounce: only show connect/disconnect toast once per cycle
  const disconnectToastShownRef = useRef(false);
  const connectToastShownRef = useRef(false);

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // ── Persist settings to localStorage on change ──
  useEffect(() => {
    saveSettings({ resolution, targetFps, quality, selectedMonitor, fitMode });
  }, [resolution, targetFps, quality, selectedMonitor, fitMode]);

  // ── Sync activePinRef whenever activePin state changes ──
  useEffect(() => {
    activePinRef.current = activePin;
  }, [activePin]);

  // ── Fetch initial data (pin + monitors) ──
  const fetchInitialData = useCallback(async () => {
    try {
      const resMonitors = await fetch(`${BACKEND_API_URL}/monitors`);
      const dataMonitors = await resMonitors.json();
      if (dataMonitors.status === 'success' && dataMonitors.monitors?.length > 0) {
        setMonitors(dataMonitors.monitors);
        if (!dataMonitors.monitors.find(m => m.id === selectedMonitor)) {
          setSelectedMonitor(dataMonitors.monitors[0].id);
        }
      }

      const resPin = await fetch(`${BACKEND_API_URL}/pin-info`);
      const dataPin = await resPin.json();
      if (dataPin.status === 'success') {
        setActivePin(dataPin.pin);
        activePinRef.current = dataPin.pin; // immediately sync ref too
      }
    } catch (err) {
      console.warn('Failed to load initial data:', err);
    }
  }, [selectedMonitor]);

  // ── CPU polling every 2s ──
  const startCpuPolling = useCallback(() => {
    if (cpuPollRef.current) clearInterval(cpuPollRef.current);
    cpuPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_API_URL}/system-stats`);
        const data = await res.json();
        if (data.status === 'success') {
          setCpuPercent(data.cpu_percent);
        }
      } catch (_) {}
    }, 2000);
  }, []);

  // ── WebSocket connection ──
  const connectWebSocket = useCallback(() => {
    if (socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
       socketRef.current.readyState === WebSocket.CONNECTING)) return;

    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

    const ws = new WebSocket(BACKEND_WS_URL);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setIsConnected(true);
      // Only show reconnect toast if we previously showed a disconnect toast
      if (disconnectToastShownRef.current) {
        toast('Reconnected to desktop stream server', 'success', 2500);
        disconnectToastShownRef.current = false;
      } else if (!connectToastShownRef.current) {
        toast('Connected to desktop stream server', 'success', 2500);
        connectToastShownRef.current = true;
      }

      // Use ref to get latest PIN — avoids stale closure race condition
      const savedPin = sessionStorage.getItem('auraview_pin_code') || activePinRef.current;
      if (sessionStorage.getItem('auraview_pin_auth') === 'true' && savedPin && savedPin !== '----') {
        ws.send(JSON.stringify({ action: 'auth', pin: savedPin }));
      }

      ws.send(JSON.stringify({
        action: 'configure',
        resolution,
        fps: targetFps,
        quality,
        monitor: selectedMonitor
      }));

      if (isStreaming) {
        ws.send(JSON.stringify({ action: 'resume' }));
      }
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'auth_result') {
            if (msg.success) {
              setIsAuthenticated(true);
              sessionStorage.setItem('auraview_pin_auth', 'true');
              if (authCallbackRef.current) { authCallbackRef.current(true); authCallbackRef.current = null; }
            } else {
              setIsAuthenticated(false);
              sessionStorage.removeItem('auraview_pin_auth');
              if (authCallbackRef.current) { authCallbackRef.current(false, msg.error); authCallbackRef.current = null; }
            }
          }
        } catch (_) {}
        return;
      }

      const now = Date.now();
      const frameBuffer = event.data;
      const frameBlob = new Blob([frameBuffer], { type: 'image/jpeg' });
      setCurrentFrameBlob(frameBlob);

      frameTimesRef.current.push(now);
      if (frameTimesRef.current.length > 30) frameTimesRef.current.shift();
      if (frameTimesRef.current.length > 1) {
        const timeDiff = (now - frameTimesRef.current[0]) / 1000;
        setFps((frameTimesRef.current.length - 1) / timeDiff);
      }

      const frameDelta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      setLatencyMs(frameDelta);

      bytesAccumulatorRef.current += frameBuffer.byteLength;
      const timeSinceLastCalc = now - lastByteCalcTimeRef.current;
      if (timeSinceLastCalc >= 1000) {
        setDataRateKb((bytesAccumulatorRef.current / 1024) / (timeSinceLastCalc / 1000));
        bytesAccumulatorRef.current = 0;
        lastByteCalcTimeRef.current = now;
      }

      setTotalFrames(prev => prev + 1);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Only show disconnect toast once per disconnect cycle (not on every retry)
      if (!disconnectToastShownRef.current) {
        disconnectToastShownRef.current = true;
        toast('Stream connection lost. Reconnecting...', 'warning', 3000);
      }
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => connectWebSocket(), 2000);
    };

    ws.onerror = () => {
      // Suppress onerror toasts — onclose always fires after onerror
      setIsConnected(false);
    };

    socketRef.current = ws;
  }, [resolution, targetFps, quality, selectedMonitor, isStreaming]);

  // ── Audio stream ──
  const startAudioStream = () => {
    if (audioSocketRef.current) audioSocketRef.current.close();

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx({ sampleRate: 44100 });
    audioCtxRef.current = audioCtx;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    nextAudioStartTimeRef.current = 0;

    // Create a gain node for visualizer tap
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 1;
    gainNode.connect(audioCtx.destination);
    audioSourceNodeRef.current = gainNode;

    const audioWs = new WebSocket(BACKEND_AUDIO_WS_URL);
    audioWs.binaryType = 'arraybuffer';

    audioWs.onopen = () => {
      setIsAudioEnabled(true);
      toast('Desktop audio stream started', 'success', 2500);
    };

    audioWs.onmessage = (event) => {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const pcm16Buffer = new Int16Array(event.data);
      const numChannels = 2;
      const totalSamples = pcm16Buffer.length / numChannels;
      if (totalSamples <= 0) return;

      const audioBuffer = ctx.createBuffer(numChannels, totalSamples, 44100);
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.getChannelData(1);

      for (let i = 0; i < totalSamples; i++) {
        leftChannel[i] = pcm16Buffer[i * 2] / 32768.0;
        rightChannel[i] = pcm16Buffer[i * 2 + 1] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);

      const MIN_LATENCY = 0.02;
      const MAX_LATENCY = 0.08;
      let startTime = nextAudioStartTimeRef.current;
      if (startTime < ctx.currentTime + MIN_LATENCY || startTime > ctx.currentTime + MAX_LATENCY) {
        startTime = ctx.currentTime + MIN_LATENCY;
      }
      source.start(startTime);
      nextAudioStartTimeRef.current = startTime + audioBuffer.duration;
    };

    audioWs.onclose = () => {
      setIsAudioEnabled(false);
    };

    audioSocketRef.current = audioWs;
  };

  const stopAudioStream = () => {
    if (audioSocketRef.current) { audioSocketRef.current.close(); audioSocketRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    audioSourceNodeRef.current = null;
    setIsAudioEnabled(false);
  };

  const handleToggleAudio = () => {
    if (!isAudioEnabled) startAudioStream();
    else { stopAudioStream(); toast('Desktop audio stopped', 'info', 2000); }
  };

  // ── Init effects ──
  useEffect(() => {
    fetchInitialData();
    connectWebSocket();
    startCpuPolling();
    return () => {
      if (socketRef.current) socketRef.current.close();
      stopAudioStream();
      if (cpuPollRef.current) clearInterval(cpuPollRef.current);
    };
  }, []);

  // ── Stream duration timer ──
  useEffect(() => {
    if (isStreaming) {
      timerIntervalRef.current = setInterval(() =>
        setStreamDurationSec(prev => prev + 1), 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isStreaming]);

  // ── WebSocket control message helper ──
  const sendControlMessage = (payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  // ── PIN verification ──
  const handleVerifyPin = async (pin, callback) => {
    authCallbackRef.current = callback;
    sessionStorage.setItem('auraview_pin_code', pin);
    try {
      const res = await fetch(`${BACKEND_API_URL}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        sessionStorage.setItem('auraview_pin_auth', 'true');
        sendControlMessage({ action: 'auth', pin });
        toast('Access granted! Stream unlocked.', 'success', 3000);
        if (callback) callback(true);
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem('auraview_pin_auth');
        if (callback) callback(false, data.detail || 'Invalid 4-digit PIN code');
      }
    } catch (err) {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ action: 'auth', pin }));
      } else {
        if (callback) callback(false, 'Unable to connect to backend server');
      }
    }
  };

  const handlePinRefreshed = (newPin) => {
    setActivePin(newPin);
    setIsAuthenticated(false);
    sessionStorage.removeItem('auraview_pin_auth');
    sessionStorage.removeItem('auraview_pin_code');
    toast(`Security PIN updated to ${newPin}`, 'warning', 5000);
  };

  // ── Stream control ──
  const handleToggleStream = () => {
    if (!isStreaming) {
      setIsStreaming(true);
      sendControlMessage({ action: 'resume' });
      toast('Screen mirroring started', 'success', 2500);
    } else {
      setIsStreaming(false);
      sendControlMessage({ action: 'pause' });
      toast('Screen mirroring paused', 'info', 2000);
    }
  };

  const handleStartStream = () => {
    setIsStreaming(true);
    sendControlMessage({ action: 'resume' });
    toast('Screen mirroring started', 'success', 2500);
  };

  const handleTogglePrivacyMode = () => {
    const nextState = !isPrivacyModeActive;
    setIsPrivacyModeActive(nextState);
    sendControlMessage({ action: 'toggle_privacy', enabled: nextState });
    toast(nextState ? 'Privacy mode enabled — screen hidden' : 'Privacy mode disabled', nextState ? 'warning' : 'info', 2500);
  };

  const handleToggleRemoteControl = () => {
    const next = !isRemoteControlActive;
    setIsRemoteControlActive(next);
    toast(next ? 'Remote mouse control activated' : 'Remote mouse control deactivated', next ? 'success' : 'info', 2000);
  };

  const handleToggleMjpegMode = () => {
    const next = !isMjpegMode;
    setIsMjpegMode(next);
    toast(next ? 'Switched to MJPEG fallback mode' : 'Switched to WebSocket mode', 'info', 2500);
  };

  const handleInputEvent = (eventData) => {
    if (isRemoteControlActive) sendControlMessage({ action: 'input_event', event: eventData });
  };

  const handleChangeResolution = (newRes) => {
    setResolution(newRes);
    sendControlMessage({ action: 'configure', resolution: newRes });
  };

  const handleChangeFps = (newFps) => {
    setTargetFps(newFps);
    sendControlMessage({ action: 'configure', fps: newFps });
  };

  const handleChangeQuality = (newQuality) => {
    setQuality(newQuality);
    sendControlMessage({ action: 'configure', quality: newQuality });
  };

  const handleChangeMonitor = (newMonitor) => {
    setSelectedMonitor(newMonitor);
    sendControlMessage({ action: 'configure', monitor: newMonitor });
    const m = monitors.find(mon => mon.id === newMonitor);
    if (m) toast(`Switched to ${m.name}`, 'info', 2000);
  };

  const handleRefreshPin = async () => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/refresh-pin`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        handlePinRefreshed(data.new_pin);
      }
    } catch (err) {
      toast('Failed to refresh PIN', 'error', 3000);
    }
  };

  // ── MJPEG stream URL ──
  const mjpegStreamUrl = `${BACKEND_API_URL}/stream?monitor=${selectedMonitor}&resolution=${resolution}&quality=${quality}&fps=${targetFps}`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Toast Notifier */}
      <ToastNotifier />

      {/* PIN Security Modal Lock */}
      {!isAuthenticated && (
        <PinLockModal onVerifyPin={handleVerifyPin} />
      )}

      <Header isStreaming={isStreaming} isConnected={isConnected} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-5 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left: Stream + Stats + Connection Info ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Stream Viewer */}
            <StreamViewer
              currentFrameBlob={currentFrameBlob}
              isStreaming={isStreaming}
              isConnected={isConnected}
              resolution={resolution}
              fps={fps}
              rotation={rotation}
              onRotate={handleRotate}
              fitMode={fitMode}
              onChangeFitMode={setFitMode}
              isRemoteControlActive={isRemoteControlActive}
              isPrivacyModeActive={isPrivacyModeActive}
              onTogglePrivacyMode={handleTogglePrivacyMode}
              onStartStream={handleStartStream}
              onReconnect={connectWebSocket}
              onInputEvent={handleInputEvent}
              isMjpegMode={isMjpegMode}
              mjpegStreamUrl={mjpegStreamUrl}
            />

            {/* Audio Visualizer (always shown when audio is active, compact below stream) */}
            {isAudioEnabled && (
              <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider shrink-0">
                  🎵 Audio
                </span>
                <div className="flex items-end gap-0.5 flex-1 h-8">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className={`audio-bar flex-1`} style={{ animationDelay: `${i * 0.04}s` }} />
                  ))}
                </div>
                <span className="text-[9px] text-emerald-500 font-mono shrink-0">WASAPI LIVE</span>
              </div>
            )}

            {/* Stats Bar */}
            <StatsBar
              fps={fps}
              latencyMs={latencyMs}
              dataRateKb={dataRateKb}
              totalFrames={totalFrames}
              streamDurationSec={streamDurationSec}
              cpuPercent={cpuPercent}
            />

            {/* Connection Info Panel */}
            <ConnectionInfoPanel
              activePin={activePin}
              onPinRefreshed={handlePinRefreshed}
            />
          </div>

          {/* ── Right: Control Panel ── */}
          <div className="lg:col-span-1">
            <ControlPanel
              isStreaming={isStreaming}
              onToggleStream={handleToggleStream}
              resolution={resolution}
              onChangeResolution={handleChangeResolution}
              targetFps={targetFps}
              onChangeFps={handleChangeFps}
              quality={quality}
              onChangeQuality={handleChangeQuality}
              selectedMonitor={selectedMonitor}
              onChangeMonitor={handleChangeMonitor}
              monitors={monitors}
              rotation={rotation}
              onChangeRotation={setRotation}
              fitMode={fitMode}
              onChangeFitMode={setFitMode}
              isRemoteControlActive={isRemoteControlActive}
              onToggleRemoteControl={handleToggleRemoteControl}
              isPrivacyModeActive={isPrivacyModeActive}
              onTogglePrivacyMode={handleTogglePrivacyMode}
              isAudioEnabled={isAudioEnabled}
              onToggleAudio={handleToggleAudio}
              onToggleFullscreen={() => {
                const elem = document.querySelector('canvas');
                if (elem) elem.requestFullscreen();
              }}
              activePin={activePin}
              onRefreshPin={handleRefreshPin}
              isMjpegMode={isMjpegMode}
              onToggleMjpegMode={handleToggleMjpegMode}
            />
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 glass-panel mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AuraView v2.0 Screen Mirroring • FastAPI + mss + WASAPI Loopback</span>
          <span className="text-slate-400 font-mono">Press 'F' for fullscreen • Settings auto-saved</span>
        </div>
      </footer>
    </div>
  );
}
