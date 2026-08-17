import React from 'react';
import { Play, Square, Sliders, Monitor, Zap, Maximize2, MousePointer, ShieldOff, Lock, Volume2, VolumeX, RotateCw, Ratio, Smartphone } from 'lucide-react';

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
  fitMode = 'contain',
  onChangeFitMode,
  isRemoteControlActive,
  onToggleRemoteControl,
  isPrivacyModeActive,
  onTogglePrivacyMode,
  isAudioEnabled,
  onToggleAudio,
  onToggleFullscreen
}) {
  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Stream Controls</h2>
            <p className="text-xs text-slate-400">Quality, audio & remote access</p>
          </div>
        </div>

        {/* Start / Stop Toggle Button */}
        <button
          onClick={onToggleStream}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
            isStreaming
              ? 'bg-rose-500/90 hover:bg-rose-600 text-white shadow-rose-500/20 border border-rose-400/30'
              : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-emerald-500/20 border border-emerald-400/40'
          }`}
        >
          {isStreaming ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Feed</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Stream</span>
            </>
          )}
        </button>
      </div>

      {/* Feature Toggles: Audio Stream, Remote Control & Privacy Freeze */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        
        {/* Desktop Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className={`flex flex-col items-start justify-between p-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
            isAudioEnabled
              ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`}></span>
          </div>
          <span className="font-semibold text-slate-200 text-[11px]">PC Sound</span>
          <span className="text-[9px] text-slate-400">{isAudioEnabled ? 'AUDIO ON' : 'AUDIO OFF'}</span>
        </button>

        {/* Remote Control Toggle */}
        <button
          onClick={onToggleRemoteControl}
          className={`flex flex-col items-start justify-between p-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
            isRemoteControlActive
              ? 'bg-cyan-500/15 border-cyan-500/80 text-cyan-300 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <MousePointer className={`w-4 h-4 ${isRemoteControlActive ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className={`w-2 h-2 rounded-full ${isRemoteControlActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`}></span>
          </div>
          <span className="font-semibold text-slate-200 text-[11px]">Remote Mouse</span>
          <span className="text-[9px] text-slate-400">Touch Control</span>
        </button>

        {/* Privacy Freeze Toggle */}
        <button
          onClick={onTogglePrivacyMode}
          className={`flex flex-col items-start justify-between p-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
            isPrivacyModeActive
              ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <ShieldOff className={`w-4 h-4 ${isPrivacyModeActive ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className={`w-2 h-2 rounded-full ${isPrivacyModeActive ? 'bg-amber-400' : 'bg-slate-700'}`}></span>
          </div>
          <span className="font-semibold text-slate-200 text-[11px]">Privacy Freeze</span>
          <span className="text-[9px] text-slate-400">Hide Feed</span>
        </button>
      </div>

      {/* Screen Orientation & Aspect Ratio Controls */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        
        {/* Rotation Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Screen Rotation</span>
            </label>
            <span className="text-amber-400 font-mono font-medium">{rotation}°</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => onChangeRotation && onChangeRotation(deg)}
                className={`py-2 rounded-xl border text-xs font-semibold font-mono transition-all duration-150 cursor-pointer ${
                  rotation === deg
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio & Fit Mode Selector */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Ratio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aspect Ratio & Fit</span>
            </label>
            <span className="text-cyan-400 font-mono font-medium uppercase">{fitMode}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'best_fit', label: 'Best Fit', sub: 'Auto Scale' },
              { id: 'fit_screen', label: 'Fit Screen', sub: 'Full Height' },
              { id: 'fill', label: 'Fill', sub: 'No Bars' },
              { id: '16:9', label: '16:9', sub: 'Wide' },
              { id: '4:3', label: '4:3', sub: 'Standard' },
              { id: 'center', label: 'Center', sub: 'Original' },
              { id: 'notch', label: '📱 Notch', sub: 'Safe Area' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onChangeFitMode && onChangeFitMode(mode.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer ${
                  fitMode === mode.id
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="font-semibold">{mode.label}</span>
                <span className="text-[9px] text-slate-500 font-mono">{mode.sub}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Resolution Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Resolution</span>
          </label>
          <span className="text-cyan-400 font-mono font-medium">{resolution.toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: '480p', label: '480p', sub: 'SD' },
            { id: '720p', label: '720p', sub: 'HD' },
            { id: '1080p', label: '1080p', sub: 'FHD' },
            { id: 'native', label: 'Native', sub: 'MAX' },
          ].map((res) => (
            <button
              key={res.id}
              onClick={() => onChangeResolution(res.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer ${
                resolution === res.id
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <span className="font-semibold">{res.label}</span>
              <span className="text-[10px] text-slate-500 font-mono">{res.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Frame Rate (FPS) Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-300">Target Frame Rate</label>
          <span className="text-amber-400 font-mono font-medium">{targetFps} FPS</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[15, 30, 60].map((rate) => (
            <button
              key={rate}
              onClick={() => onChangeFps(rate)}
              className={`py-2 rounded-xl border text-xs font-semibold font-mono transition-all duration-150 cursor-pointer ${
                targetFps === rate
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {rate} FPS
            </button>
          ))}
        </div>
      </div>

      {/* Compression Quality Slider */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-300">JPEG Compression Quality</label>
          <span className="text-emerald-400 font-mono font-medium">{quality}%</span>
        </div>
        <input
          type="range"
          min="20"
          max="95"
          step="5"
          value={quality}
          onChange={(e) => onChangeQuality(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      {/* Monitor Display Selector */}
      <div className="space-y-2.5">
        <label className="font-semibold text-slate-300 text-xs flex items-center space-x-1.5">
          <Monitor className="w-3.5 h-3.5 text-slate-400" />
          <span>Select Display Source</span>
        </label>
        <select
          value={selectedMonitor}
          onChange={(e) => onChangeMonitor(Number(e.target.value))}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 transition-colors cursor-pointer"
        >
          {monitors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.width}x{m.height})
            </option>
          ))}
        </select>
      </div>

      {/* PIN Security Status Badge */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
        <span className="flex items-center space-x-1.5 text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Security Lock:</span>
        </span>
        <span className="font-mono text-emerald-400 font-semibold">PIN Active (1234)</span>
      </div>

      {/* Quick Fullscreen Action */}
      <button
        onClick={onToggleFullscreen}
        className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all duration-200 cursor-pointer"
      >
        <Maximize2 className="w-4 h-4 text-cyan-400" />
        <span>Toggle Fullscreen View</span>
      </button>

    </div>
  );
}
