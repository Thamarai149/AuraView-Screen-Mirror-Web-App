import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Monitor, CheckCircle } from 'lucide-react';

const BACKEND_API_URL = `http://${window.location.hostname}:8000/api`;

export default function MonitorPreviewTiles({ monitors, selectedMonitor, onChangeMonitor }) {
  const [thumbnails, setThumbnails] = useState({});
  const intervalRef = useRef(null);

  const fetchThumbnail = useCallback(async (monitorId) => {
    try {
      const url = `${BACKEND_API_URL}/stream?monitor=${monitorId}&resolution=480p&quality=40&fps=1`;
      // Use MJPEG single frame via fetch — just grab the first chunk
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) return;

      const reader = res.body.getReader();
      let buffer = new Uint8Array(0);
      let found = false;

      while (!found) {
        const { done, value } = await reader.read();
        if (done) break;

        const merged = new Uint8Array(buffer.length + value.length);
        merged.set(buffer);
        merged.set(value, buffer.length);
        buffer = merged;

        // Look for JPEG start (FF D8) and end (FF D9)
        const text = new TextDecoder('ascii', { fatal: false }).decode(buffer);
        const startIdx = text.indexOf('\xff\xd8');
        const endIdx = text.indexOf('\xff\xd9', startIdx);

        if (startIdx !== -1 && endIdx !== -1) {
          const jpegBytes = buffer.slice(startIdx, endIdx + 2);
          const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
          const objUrl = URL.createObjectURL(blob);
          setThumbnails(prev => {
            if (prev[monitorId]) URL.revokeObjectURL(prev[monitorId]);
            return { ...prev, [monitorId]: objUrl };
          });
          found = true;
        }

        if (buffer.length > 200000) break; // Safety cap
      }

      reader.cancel();
    } catch (_) {}
  }, []);

  // Periodically refresh thumbnails for all monitors every 5 seconds
  useEffect(() => {
    if (!monitors || monitors.length === 0) return;

    const refresh = () => {
      monitors.forEach(m => fetchThumbnail(m.id));
    };

    refresh();
    intervalRef.current = setInterval(refresh, 5000);

    return () => {
      clearInterval(intervalRef.current);
      // Revoke all object URLs on unmount
      Object.values(thumbnails).forEach(u => URL.revokeObjectURL(u));
    };
  }, [monitors, fetchThumbnail]);

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
          const thumb = thumbnails[m.id];
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
              {/* Thumbnail or placeholder */}
              <div className="w-full aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={`Monitor ${m.id} preview`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <Monitor className="w-5 h-5 text-slate-500" />
                    <span className="text-[9px] text-slate-500 font-mono">{m.width}×{m.height}</span>
                  </div>
                )}
                {/* Active overlay */}
                {isActive && (
                  <div className="absolute inset-0 bg-cyan-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-cyan-400 drop-shadow-lg" />
                  </div>
                )}
              </div>
              {/* Label */}
              <div className={`px-2 py-1.5 text-left text-[10px] font-medium transition-colors ${
                isActive ? 'bg-cyan-500/10 text-cyan-300' : 'bg-slate-900/80 text-slate-400'
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
