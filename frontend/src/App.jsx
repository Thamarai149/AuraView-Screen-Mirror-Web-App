import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import StreamViewer from './components/StreamViewer';
import ControlPanel from './components/ControlPanel';
import StatsBar from './components/StatsBar';
import PinLockModal from './components/PinLockModal';

const BACKEND_WS_URL = `ws://${window.location.hostname}:8000/ws/stream`;
const BACKEND_AUDIO_WS_URL = `ws://${window.location.hostname}:8000/ws/audio`;
const BACKEND_API_URL = `http://${window.location.hostname}:8000/api`;

export default function App() {
  // Authentication & Stream state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('auraview_pin_auth') === 'true';
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [currentFrameBlob, setCurrentFrameBlob] = useState(null);
  const [activePin, setActivePin] = useState('----');

  // New Features state
  const [isRemoteControlActive, setIsRemoteControlActive] = useState(false);
  const [isPrivacyModeActive, setIsPrivacyModeActive] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [fitMode, setFitMode] = useState('best_fit');

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Configuration state
  const [resolution, setResolution] = useState('720p');
  const [targetFps, setTargetFps] = useState(30);
  const [quality, setQuality] = useState(70);
  const [selectedMonitor, setSelectedMonitor] = useState(1);
  const [monitors, setMonitors] = useState([
    { id: 1, name: 'Primary Monitor', width: 1920, height: 1080 }
  ]);

  // Telemetry state
  const [fps, setFps] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [dataRateKb, setDataRateKb] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [streamDurationSec, setStreamDurationSec] = useState(0);

  // Refs
  const socketRef = useRef(null);
  const audioSocketRef = useRef(null);
  const audioCtxRef = useRef(null);
  const nextAudioStartTimeRef = useRef(0);
  const authCallbackRef = useRef(null);
  const frameTimesRef = useRef([]);
  const bytesAccumulatorRef = useRef(0);
  const lastByteCalcTimeRef = useRef(Date.now());
  const timerIntervalRef = useRef(null);
  const lastFrameTimeRef = useRef(Date.now());

  // Fetch initial pin info & available monitors
  const fetchInitialData = useCallback(async () => {
    try {
      const resMonitors = await fetch(`${BACKEND_API_URL}/monitors`);
      const dataMonitors = await resMonitors.json();
      if (dataMonitors.status === 'success' && dataMonitors.monitors?.length > 0) {
        setMonitors(dataMonitors.monitors);
        if (dataMonitors.monitors.find(m => m.id === 1)) {
          setSelectedMonitor(1);
        } else {
          setSelectedMonitor(dataMonitors.monitors[0].id);
        }
      }

      const resPin = await fetch(`${BACKEND_API_URL}/pin-info`);
      const dataPin = await resPin.json();
      if (dataPin.status === 'success') {
        setActivePin(dataPin.pin);
      }
    } catch (err) {
      console.warn("Failed to load initial data from backend:", err);
    }
  }, []);

  // Initialize Video WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(BACKEND_WS_URL);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      console.log("Connected to desktop screen stream server.");
      setIsConnected(true);

      const savedPin = sessionStorage.getItem('auraview_pin_code') || activePin;
      if (sessionStorage.getItem('auraview_pin_auth') === 'true') {
        ws.send(JSON.stringify({ action: 'auth', pin: savedPin }));
      }
      
      ws.send(JSON.stringify({
        action: 'configure',
        resolution,
        fps: targetFps,
        quality,
        monitor: selectedMonitor
      }));
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'auth_result') {
            if (msg.success) {
              setIsAuthenticated(true);
              sessionStorage.setItem('auraview_pin_auth', 'true');
              if (authCallbackRef.current) authCallbackRef.current(true);
            } else {
              setIsAuthenticated(false);
              sessionStorage.removeItem('auraview_pin_auth');
              if (authCallbackRef.current) authCallbackRef.current(false, msg.error);
            }
          }
        } catch (e) {}
        return;
      }

      const now = Date.now();
      const frameBuffer = event.data;
      const frameBlob = new Blob([frameBuffer], { type: 'image/jpeg' });
      setCurrentFrameBlob(frameBlob);

      frameTimesRef.current.push(now);
      if (frameTimesRef.current.length > 30) {
        frameTimesRef.current.shift();
      }
      if (frameTimesRef.current.length > 1) {
        const timeDiff = (now - frameTimesRef.current[0]) / 1000;
        const currentFps = (frameTimesRef.current.length - 1) / timeDiff;
        setFps(currentFps);
      }

      const frameDelta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      setLatencyMs(frameDelta);

      bytesAccumulatorRef.current += frameBuffer.byteLength;
      const timeSinceLastCalc = now - lastByteCalcTimeRef.current;
      if (timeSinceLastCalc >= 1000) {
        const kbPerSec = (bytesAccumulatorRef.current / 1024) / (timeSinceLastCalc / 1000);
        setDataRateKb(kbPerSec);
        bytesAccumulatorRef.current = 0;
        lastByteCalcTimeRef.current = now;
      }

      setTotalFrames(prev => prev + 1);
    };

    ws.onclose = () => {
      console.warn("WebSocket stream disconnected");
      setIsConnected(false);
      setIsStreaming(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setIsConnected(false);
    };

    socketRef.current = ws;
  }, [resolution, targetFps, quality, selectedMonitor, activePin]);

  // Handle Desktop Audio Web Audio API Player
  const startAudioStream = () => {
    if (audioSocketRef.current) {
      audioSocketRef.current.close();
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx({ sampleRate: 44100 });
    audioCtxRef.current = audioCtx;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    nextAudioStartTimeRef.current = audioCtx.currentTime;

    const audioWs = new WebSocket(BACKEND_AUDIO_WS_URL);
    audioWs.binaryType = 'arraybuffer';

    audioWs.onopen = () => {
      console.log("Desktop Audio WebSocket connected");
      setIsAudioEnabled(true);
    };

    audioWs.onmessage = (event) => {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

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
      source.connect(ctx.destination);

      let startTime = nextAudioStartTimeRef.current;
      if (startTime < ctx.currentTime || startTime > ctx.currentTime + 0.3) {
        startTime = ctx.currentTime + 0.05;
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
    if (audioSocketRef.current) {
      audioSocketRef.current.close();
      audioSocketRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsAudioEnabled(false);
  };

  const handleToggleAudio = () => {
    if (!isAudioEnabled) {
      startAudioStream();
    } else {
      stopAudioStream();
    }
  };

  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    return () => {
      if (socketRef.current) socketRef.current.close();
      stopAudioStream();
    };
  }, []);

  // Duration timer when streaming
  useEffect(() => {
    if (isStreaming) {
      timerIntervalRef.current = setInterval(() => {
        setStreamDurationSec(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isStreaming]);

  // Send control updates over WebSocket
  const sendControlMessage = (payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  const handleVerifyPin = (pin, callback) => {
    authCallbackRef.current = callback;
    sessionStorage.setItem('auraview_pin_code', pin);
    sendControlMessage({ action: 'auth', pin });
  };

  const handlePinRefreshed = (newPin) => {
    setActivePin(newPin);
    // Force re-auth on new PIN change
    setIsAuthenticated(false);
    sessionStorage.removeItem('auraview_pin_auth');
    sessionStorage.removeItem('auraview_pin_code');
  };

  const handleToggleStream = () => {
    if (!isStreaming) {
      setIsStreaming(true);
      sendControlMessage({ action: 'resume' });
      if (!isAudioEnabled) {
        startAudioStream();
      }
    } else {
      setIsStreaming(false);
      sendControlMessage({ action: 'pause' });
    }
  };

  const handleStartStream = () => {
    setIsStreaming(true);
    sendControlMessage({ action: 'resume' });
    if (!isAudioEnabled) {
      startAudioStream();
    }
  };

  const handleTogglePrivacyMode = () => {
    const nextState = !isPrivacyModeActive;
    setIsPrivacyModeActive(nextState);
    sendControlMessage({ action: 'toggle_privacy', enabled: nextState });
  };

  const handleToggleRemoteControl = () => {
    setIsRemoteControlActive(prev => !prev);
  };

  const handleInputEvent = (eventData) => {
    if (isRemoteControlActive) {
      sendControlMessage({
        action: 'input_event',
        event: eventData
      });
    }
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
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* PIN Security Modal Lock */}
      {!isAuthenticated && (
        <PinLockModal onVerifyPin={handleVerifyPin} />
      )}

      <Header isStreaming={isStreaming} isConnected={isConnected} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Video Screen Stream */}
          <div className="lg:col-span-2 space-y-6">
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
            />

            {/* Performance Diagnostics */}
            <StatsBar
              fps={fps}
              latencyMs={latencyMs}
              dataRateKb={dataRateKb}
              totalFrames={totalFrames}
              streamDurationSec={streamDurationSec}
            />
          </div>

          {/* Control Panel */}
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
            />
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 glass-panel mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AuraView Screen Mirroring System • Powered by FastAPI, mss & WASAPI Loopback</span>
          <span className="text-slate-400 font-mono">Press 'F' for full screen mode</span>
        </div>
      </footer>
    </div>
  );
}
