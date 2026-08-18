import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, RefreshCw, Wifi, QrCode, Lock, Globe, Shield } from 'lucide-react';

const BACKEND_API_URL = `http://${window.location.hostname}:8000/api`;

export default function ConnectionInfoPanel({ activePin, onPinRefreshed }) {
  const [hostInfo, setHostInfo] = useState({ ip: '...', port: 5173 });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const canvasRef = useRef(null);

  const streamUrl = `http://${hostInfo.ip}:${hostInfo.port}`;

  // Fetch host info (IP + port) from backend pin-info endpoint
  const fetchHostInfo = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/pin-info`);
      const data = await res.json();
      if (data.status === 'success') {
        setHostInfo({ ip: data.host_ip, port: data.port });
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchHostInfo();
  }, [fetchHostInfo]);

  // Generate QR code whenever URL changes
  useEffect(() => {
    if (!streamUrl || streamUrl.includes('...')) return;
    QRCode.toDataURL(streamUrl, {
      width: 160,
      margin: 1,
      color: { dark: '#e2e8f0', light: '#0f172a' },
      errorCorrectionLevel: 'M'
    }).then(setQrDataUrl).catch(() => {});
  }, [streamUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(streamUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRefreshPin = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${BACKEND_API_URL}/refresh-pin`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success' && onPinRefreshed) {
        onPinRefreshed(data.new_pin);
      }
    } catch (err) {
      console.error('Failed to refresh PIN:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Connection Info</h3>
            <p className="text-[10px] text-slate-400">Scan or open on your device</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <Globe className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400">LAN</span>
        </div>
      </div>

      {/* QR Code + Info row */}
      <div className="flex items-start gap-4">
        {/* QR Code */}
        <div className="shrink-0">
          {qrDataUrl ? (
            <div className="qr-glow p-2 rounded-xl bg-slate-900 border border-slate-700/60">
              <img src={qrDataUrl} alt="QR Code for stream URL" className="w-28 h-28 rounded-lg" />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-slate-600 animate-pulse" />
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="flex-1 space-y-2.5 min-w-0">
          {/* Stream URL */}
          <div>
            <p className="section-label mb-1">Stream URL</p>
            <div className="flex items-center gap-1.5">
              <code className="flex-1 text-[11px] font-mono text-cyan-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 truncate">
                {streamUrl}
              </code>
              <button
                onClick={handleCopy}
                title="Copy URL"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* IP Address */}
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="section-label mb-1">Host IP</p>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="text-[11px] font-mono text-slate-200">{hostInfo.ip}</span>
              </div>
            </div>
            <div>
              <p className="section-label mb-1">Port</p>
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] font-mono text-slate-200">{hostInfo.port}</span>
              </div>
            </div>
          </div>

          {/* PIN display */}
          <div>
            <p className="section-label mb-1">Security PIN</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 flex-1">
                <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="text-base font-bold font-mono tracking-[0.3em] text-cyan-300">
                  {activePin || '----'}
                </span>
              </div>
              <button
                onClick={handleRefreshPin}
                disabled={isRefreshing}
                title="Generate new PIN"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-slate-400 hover:text-amber-300 transition-all cursor-pointer border border-slate-700 hover:border-amber-500/40 disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-slate-500 text-center pt-1 border-t border-slate-800/60">
        📱 Open the URL on any device on your network, then enter the PIN to start viewing
      </p>
    </div>
  );
}
