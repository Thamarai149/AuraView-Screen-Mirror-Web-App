import React from 'react';
import {
  Play, Square, Sliders, Zap, Maximize2, MousePointer, ShieldOff,
  Lock, Volume2, VolumeX, RotateCw, Ratio, RefreshCw, Globe, Shield
} from 'lucide-react';
import MonitorPreviewTiles from './MonitorPreviewTiles';

export default function ControlPanel({
  isStreaming,
  onToggleStream,
  resolution,
  onChangeResolution,
  targetFps,
  onChangeFps,
  quality,
  onChangeQuality,
  selectedMonitor,
  onChangeMonitor,
  monitors,
  rotation = 0,
  onChangeRotation,
  fitMode = 'best_fit',
  onChangeFitMode,
  isRemoteControlActive,
  onToggleRemoteControl,
  isPrivacyModeActive,
  onTogglePrivacyMode,
  isAudioEnabled,
  onToggleAudio,
  onToggleFullscreen,
  activePin,
  onRefreshPin,
  isMjpegMode,
  onToggleMjpegMode,
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-5">

      {/* ── Panel Header ── */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Stream Controls</h2>
            <p className="text-[10px] text-slate-400">Quality · Audio · Remote Access</p>
          </div>
        </div>

        {/* Start / Stop Toggle */}
        <button
          onClick={onToggleStream}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-[1.03] active:scale-[0.97] ${
            isStreaming
              ? 'bg-rose-500/90 hover:bg-rose-600 text-white shadow-rose-500/20 border border-rose-400/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 border border-emerald-400/40'
          }`}
        >
          {isStreaming ? (
            <><Square className="w-3.5 h-3.5 fill-current" /><span>Stop</span></>
          ) : (
            <><Play className="w-3.5 h-3.5 fill-current" /><span>Start</span></>
          )}
        </button>
      </div>

      {/* ── Feature Toggles ── */}
      <div>
        <p className="section-label mb-2">Features</p>
        <div className="grid grid-cols-2 gap-2">

          {/* Audio */}
          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
              isAudioEnabled
                ? 'bg-emerald-500/15 border-emerald-500/70 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            {isAudioEnabled
              ? <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              : <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            }
            <div className="text-left min-w-0">
              <div className="font-semibold text-[10px] text-slate-200 truncate">PC Sound</div>
              <div className="text-[9px] text-slate-500">{isAudioEnabled ? 'ON' : 'OFF'}</div>
            </div>
            <span className={`ml-auto w-2 h-2 rounded-full shrink-0 ${isAudioEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`} />
          </button>

          {/* Remote Mouse */}
          <button
            onClick={onToggleRemoteControl}
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
              isRemoteControlActive
                ? 'bg-cyan-500/15 border-cyan-500/70 text-cyan-300 ring-1 ring-cyan-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <MousePointer className={`w-3.5 h-3.5 shrink-0 ${isRemoteControlActive ? 'text-cyan-400' : 'text-slate-500'}`} />
            <div className="text-left min-w-0">
              <div className="font-semibold text-[10px] text-slate-200 truncate">Remote Mouse</div>
              <div className="text-[9px] text-slate-500">{isRemoteControlActive ? 'ACTIVE' : 'OFF'}</div>
            </div>
            <span className={`ml-auto w-2 h-2 rounded-full shrink-0 ${isRemoteControlActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`} />
          </button>

          {/* Privacy Freeze */}
          <button
            onClick={onTogglePrivacyMode}
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
              isPrivacyModeActive
                ? 'bg-amber-500/15 border-amber-500/70 text-amber-300 ring-1 ring-amber-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <ShieldOff className={`w-3.5 h-3.5 shrink-0 ${isPrivacyModeActive ? 'text-amber-400' : 'text-slate-500'}`} />
            <div className="text-left min-w-0">
              <div className="font-semibold text-[10px] text-slate-200 truncate">Privacy Freeze</div>
              <div className="text-[9px] text-slate-500">{isPrivacyModeActive ? 'FROZEN' : 'OFF'}</div>
            </div>
            <span className={`ml-auto w-2 h-2 rounded-full shrink-0 ${isPrivacyModeActive ? 'bg-amber-400' : 'bg-slate-700'}`} />
          </button>

          {/* MJPEG Fallback */}
          <button
            onClick={onToggleMjpegMode}
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
              isMjpegMode
                ? 'bg-indigo-500/15 border-indigo-500/70 text-indigo-300 ring-1 ring-indigo-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Globe className={`w-3.5 h-3.5 shrink-0 ${isMjpegMode ? 'text-indigo-400' : 'text-slate-500'}`} />
            <div className="text-left min-w-0">
              <div className="font-semibold text-[10px] text-slate-200 truncate">MJPEG Mode</div>
              <div className="text-[9px] text-slate-500">{isMjpegMode ? 'FALLBACK' : 'WS'}</div>
            </div>
            <span className={`ml-auto w-2 h-2 rounded-full shrink-0 ${isMjpegMode ? 'bg-indigo-400' : 'bg-slate-700'}`} />
          </button>
        </div>
      </div>

      {/* ── Screen Rotation ── */}
      <div className="space-y-2 pt-1 border-t border-slate-800/60">
        <div className="flex items-center justify-between">
          <label className="section-label flex items-center gap-1.5">
            <RotateCw className="w-3 h-3 text-amber-400" />
            Screen Rotation
          </label>
          <span className="text-amber-400 font-mono text-xs font-bold">{rotation}°</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 90, 180, 270].map(deg => (
            <button
              key={deg}
              onClick={() => onChangeRotation && onChangeRotation(deg)}
              className={`py-1.5 rounded-lg border text-[10px] font-bold font-mono transition-all duration-150 cursor-pointer ${
                rotation === deg
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* ── Aspect Ratio / Fit Mode ── */}
      <div className="space-y-2 border-t border-slate-800/60 pt-1">
        <div className="flex items-center justify-between">
          <label className="section-label flex items-center gap-1.5">
            <Ratio className="w-3 h-3 text-cyan-400" />
            Fit Mode
          </label>
          <span className="text-cyan-400 font-mono text-[10px] font-bold uppercase">{fitMode}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'best_fit', label: 'Best Fit', sub: 'Auto Scale' },
            { id: 'fit_screen', label: 'Fit Screen', sub: 'Full Height' },
            { id: 'fill', label: 'Fill', sub: 'No Bars' },
            { id: '16:9', label: '16:9', sub: 'Wide' },
            { id: '4:3', label: '4:3', sub: 'Standard' },
            { id: 'notch', label: '📱 Notch', sub: 'Safe Area' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => onChangeFitMode && onChangeFitMode(mode.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] font-medium transition-all duration-150 cursor-pointer ${
                fitMode === mode.id
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <span className="font-bold">{mode.label}</span>
              <span className="text-[8px] text-slate-500">{mode.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Resolution ── */}
      <div className="space-y-2 border-t border-slate-800/60 pt-1">
        <div className="flex items-center justify-between">
          <label className="section-label flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-cyan-400" />
            Resolution
          </label>
          <span className="text-cyan-400 font-mono text-[10px] font-bold">{resolution.toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: '480p', label: '480p', sub: 'SD' },
            { id: '720p', label: '720p', sub: 'HD' },
            { id: '1080p', label: '1080p', sub: 'FHD' },
            { id: 'native', label: 'Native', sub: 'MAX' },
          ].map(res => (
            <button
              key={res.id}
              onClick={() => onChangeResolution(res.id)}
              className={`flex flex-col items-center py-2 rounded-lg border text-[10px] font-medium transition-all duration-150 cursor-pointer ${
                resolution === res.id
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <span className="font-bold">{res.label}</span>
              <span className="text-[8px] text-slate-500">{res.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Frame Rate ── */}
      <div className="space-y-2 border-t border-slate-800/60 pt-1">
        <div className="flex items-center justify-between">
          <label className="section-label">Frame Rate</label>
          <span className="text-amber-400 font-mono text-[10px] font-bold">{targetFps} FPS</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[15, 30, 60].map(rate => (
            <button
              key={rate}
              onClick={() => onChangeFps(rate)}
              className={`py-1.5 rounded-lg border text-[10px] font-bold font-mono transition-all duration-150 cursor-pointer ${
                targetFps === rate
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {rate} FPS
            </button>
          ))}
        </div>
      </div>

      {/* ── Quality Slider ── */}
      <div className="space-y-2 border-t border-slate-800/60 pt-1">
        <div className="flex items-center justify-between">
          <label className="section-label">JPEG Quality</label>
          <span className="text-emerald-400 font-mono text-[10px] font-bold">{quality}%</span>
        </div>
        <input
          type="range"
          min="20" max="95" step="5"
          value={quality}
          onChange={e => onChangeQuality(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-[8px] text-slate-600 font-mono">
          <span>20% (Fast)</span><span>60% (Balanced)</span><span>95% (Best)</span>
        </div>
      </div>

      {/* ── Monitor Selector ── */}
      <div className="border-t border-slate-800/60 pt-3 space-y-2">
        <MonitorPreviewTiles
          monitors={monitors}
          selectedMonitor={selectedMonitor}
          onChangeMonitor={onChangeMonitor}
        />
      </div>

      {/* ── PIN Security Status ── */}
      <div className="border-t border-slate-800/60 pt-3 space-y-2">
        <p className="section-label flex items-center gap-1">
          <Shield className="w-3 h-3 text-cyan-400" />
          Security PIN
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/20">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-mono text-base font-bold text-cyan-300 tracking-[0.3em] flex-1">
              {activePin || '----'}
            </span>
            <span className="text-[8px] text-emerald-500 font-semibold">ACTIVE</span>
          </div>
          <button
            onClick={onRefreshPin}
            title="Generate new PIN"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500/20 text-slate-500 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Fullscreen Action ── */}
      <button
        onClick={onToggleFullscreen}
        className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all duration-200 cursor-pointer"
      >
        <Maximize2 className="w-4 h-4 text-cyan-400" />
        <span>Toggle Fullscreen View</span>
      </button>

    </div>
  );
}
