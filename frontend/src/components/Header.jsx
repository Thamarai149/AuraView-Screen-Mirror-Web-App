import React from 'react';
import { Monitor, Radio, Shield, Cpu, Wifi, WifiOff } from 'lucide-react';

export default function Header({ isStreaming, isConnected }) {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-6 py-3.5 mb-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand logo & title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
            <Monitor className="w-5 h-5 text-white" />
            {isStreaming && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AuraView Screen Mirror
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">High-Performance Desktop Streamer</p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center space-x-3">
          {/* Engine Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Engine: <strong className="text-slate-200 font-medium">mss + FastAPI</strong></span>
          </div>

          {/* Connection indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass-card text-xs">
            {isConnected
              ? <Wifi className="w-3 h-3 text-emerald-400" />
              : <WifiOff className="w-3 h-3 text-rose-400" />
            }
            <span className={`text-[10px] font-semibold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* Live / Standby / Disconnected pill */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg glass-card text-xs transition-all duration-500 ${
            isStreaming ? 'shadow-lg shadow-emerald-500/10' : ''
          }`}>
            <Radio className={`w-3.5 h-3.5 ${isStreaming ? 'text-emerald-400 animate-live' : 'text-slate-500'}`} />
            <span className="font-medium text-slate-300">
              {isStreaming ? (
                <span className="live-shimmer-text font-bold">LIVE STREAMING</span>
              ) : isConnected ? (
                <span className="text-amber-400 font-semibold">STANDBY</span>
              ) : (
                <span className="text-rose-400 font-semibold">DISCONNECTED</span>
              )}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
