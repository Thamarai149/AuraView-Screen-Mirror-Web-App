import React from 'react';
import { Activity, Gauge, HardDrive, Clock, BarChart2 } from 'lucide-react';

export default function StatsBar({
  fps,
  latencyMs,
  dataRateKb,
  totalFrames,
  streamDurationSec
}) {
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl">
      <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs mb-3">
        <BarChart2 className="w-4 h-4 text-cyan-400" />
        <span>Real-Time Stream Diagnostics</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* FPS Counter */}
        <div className="glass-card rounded-xl p-3 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Rendering FPS</div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              {fps > 0 ? fps.toFixed(1) : '0.0'} <span className="text-[10px] text-slate-500">FPS</span>
            </div>
          </div>
        </div>

        {/* Latency */}
        <div className="glass-card rounded-xl p-3 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Frame Latency</div>
            <div className="text-sm font-bold font-mono text-cyan-300">
              {latencyMs > 0 ? `${latencyMs} ms` : '--'}
            </div>
          </div>
        </div>

        {/* Data Transfer Rate */}
        <div className="glass-card rounded-xl p-3 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Bitrate Speed</div>
            <div className="text-sm font-bold font-mono text-indigo-300">
              {dataRateKb > 1024 
                ? `${(dataRateKb / 1024).toFixed(2)} MB/s`
                : `${dataRateKb.toFixed(0)} KB/s`
              }
            </div>
          </div>
        </div>

        {/* Stream Timer */}
        <div className="glass-card rounded-xl p-3 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Uptime Duration</div>
            <div className="text-sm font-bold font-mono text-amber-300">
              {formatDuration(streamDurationSec)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
