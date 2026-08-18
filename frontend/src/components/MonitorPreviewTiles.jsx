import React, { useEffect, useState } from 'react';
import { Monitor, CheckCircle } from 'lucide-react';

const host = (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== '') ? window.location.hostname : '127.0.0.1';
const BACKEND_API_URL = `http://${host}:8000/api`;

export default function MonitorPreviewTiles({ monitors, selectedMonitor, onChangeMonitor }) {
  const [timestamp, setTimestamp] = useState(() => Date.now());

  // Periodically refresh thumbnails for all monitors every 4 seconds
  useEffect(() => {
    if (!monitors || monitors.length <= 1) return;

    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 4000);

    return () => clearInterval(interval);
  }, [monitors]);

  if (!monitors || monitors.length <= 1) {
    // Single monitor — show simplified card
    return (
      <div className="space-y-2">
        <p className="section-label">Display Source</p>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-200 flex-1">{monitors?.[0]?.name || 'Primary Monitor'}</span>
          <span className="text-[10px] font-mono text-slate-400">{monitors?.[0]?.width}×{monitors?.[0]?.height}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="section-label">Select Display Source</p>
      <div className="grid grid-cols-2 gap-2">
        {monitors.map(m => {
          const isActive = m.id === selectedMonitor;
          const snapshotUrl = `${BACKEND_API_URL}/snapshot?monitor=${m.id}&resolution=480p&quality=35&t=${timestamp}`;

          return (
            <button
              key={m.id}
              onClick={() => onChangeMonitor && onChangeMonitor(m.id)}
              className={`relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer group ${
                isActive
                  ? 'border-cyan-500/80 monitor-tile-active'
                  : 'border-slate-700/60 hover:border-slate-600'
              }`}
            >
              {/* Thumbnail snapshot */}
              <div className="w-full aspect-video bg-slate-900 flex items-center justify-center overflow-hidden relative">
                <img
                  src={snapshotUrl}
                  alt={`Monitor ${m.id} preview`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Active overlay check */}
                {isActive && (
                  <div className="absolute inset-0 bg-cyan-500/15 flex items-center justify-center backdrop-blur-[1px]">
                    <CheckCircle className="w-5 h-5 text-cyan-300 drop-shadow-lg" />
                  </div>
                )}
              </div>
              {/* Label */}
              <div className={`px-2 py-1.5 text-left text-[10px] font-medium transition-colors ${
                isActive ? 'bg-cyan-500/10 text-cyan-300 font-bold' : 'bg-slate-900/80 text-slate-400'
              }`}>
                <span className="truncate block">{m.name}</span>
                <span className="font-mono text-[9px] text-slate-500">{m.width}×{m.height}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
