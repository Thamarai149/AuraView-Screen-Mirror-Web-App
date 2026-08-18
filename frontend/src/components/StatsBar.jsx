import React from 'react';
import { Activity, Gauge, HardDrive, Clock, BarChart2, Cpu, Wifi, AlertTriangle } from 'lucide-react';

export default function StatsBar({
  fps,
  latencyMs,
  dataRateKb,
  totalFrames,
  streamDurationSec,
  cpuPercent = 0,
  droppedFrames = 0,
}) {
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Network quality derived from frame latency
  const getNetQuality = () => {
    if (latencyMs <= 0) return { label: 'N/A', color: 'text-slate-500', bars: 0 };
    if (latencyMs < 50) return { label: 'Excellent', color: 'text-emerald-400', bars: 4 };
    if (latencyMs < 100) return { label: 'Good', color: 'text-cyan-400', bars: 3 };
    if (latencyMs < 200) return { label: 'Fair', color: 'text-amber-400', bars: 2 };
    return { label: 'Poor', color: 'text-rose-400', bars: 1 };
  };

  const netQ = getNetQuality();

  // Packet loss estimate: % of expected frames dropped
  const expectedFrames = streamDurationSec * 30;
  const packetLossPct = expectedFrames > 0
    ? Math.max(0, Math.min(100, ((expectedFrames - totalFrames) / expectedFrames) * 100))
    : 0;

  const cpuColor = cpuPercent > 85 ? 'text-rose-400' : cpuPercent > 60 ? 'text-amber-400' : 'text-violet-400';

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <span>Real-Time Stream Diagnostics</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{totalFrames.toLocaleString()} frames total</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">

        {/* FPS Counter */}
        <div className="relative glass-card rounded-xl p-3 flex items-center space-x-2.5 stat-card-accent-emerald overflow-hidden">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Gauge className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">FPS</div>
            <div className="text-sm font-bold font-mono text-emerald-400 truncate">
              {fps > 0 ? fps.toFixed(1) : '0.0'}
              <span className="text-[9px] text-slate-500 ml-0.5">fps</span>
            </div>
          </div>
        </div>

        {/* Latency */}
        <div className="relative glass-card rounded-xl p-3 flex items-center space-x-2.5 stat-card-accent-cyan overflow-hidden">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Latency</div>
            <div className="text-sm font-bold font-mono text-cyan-300 truncate">
              {latencyMs > 0 ? `${latencyMs}` : '--'}
              <span className="text-[9px] text-slate-500 ml-0.5">ms</span>
            </div>
          </div>
        </div>

        {/* Bitrate */}
        <div className="relative glass-card rounded-xl p-3 flex items-center space-x-2.5 stat-card-accent-indigo overflow-hidden">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <HardDrive className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Bitrate</div>
            <div className="text-sm font-bold font-mono text-indigo-300 truncate">
              {dataRateKb > 1024
                ? `${(dataRateKb / 1024).toFixed(1)} MB/s`
                : `${dataRateKb.toFixed(0)} KB/s`
              }
            </div>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="relative glass-card rounded-xl p-3 flex items-center space-x-2.5 stat-card-accent-violet overflow-hidden">
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">CPU</div>
            <div className={`text-sm font-bold font-mono ${cpuColor} truncate`}>
              {cpuPercent.toFixed(0)}
              <span className="text-[9px] text-slate-500 ml-0.5">%</span>
            </div>
          </div>
        </div>

        {/* Network Quality */}
        <div className="relative glass-card rounded-xl p-3 flex items-center space-x-2.5 stat-card-accent-rose overflow-hidden">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <Wifi className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Net Quality</div>
            <div className={`text-xs font-bold ${netQ.color} flex items-center gap-1`}>
              <span>{netQ.label}</span>
              <div className="flex items-end gap-0.5">
                {[1,2,3,4].map(b => (
                  <div
                    key={b}
                    className="quality-bar rounded-sm"
                    style={{
                      width: 3,
                      height: `${b * 4}px`,
                      background: b <= netQ.bars
                        ? (netQ.bars >= 3 ? '#10b981' : netQ.bars === 2 ? '#f59e0b' : '#f43f5e')
                        : 'rgba(100,116,139,0.3)'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="relative glass-card rounded-xl p-3 flex items-center space-x-2.5 stat-card-accent-amber overflow-hidden">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Uptime</div>
            <div className="text-xs font-bold font-mono text-amber-300 truncate">
              {formatDuration(streamDurationSec)}
            </div>
          </div>
        </div>

      </div>

      {/* Packet loss bar */}
      {streamDurationSec > 5 && (
        <div className="mt-3 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="text-[9px] text-slate-500 w-20 shrink-0">Frame Drop Est.</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                packetLossPct < 5 ? 'bg-emerald-500' : packetLossPct < 15 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, packetLossPct)}%` }}
            />
          </div>
          <span className={`text-[9px] font-mono w-10 text-right shrink-0 ${
            packetLossPct < 5 ? 'text-emerald-400' : packetLossPct < 15 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {packetLossPct.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
