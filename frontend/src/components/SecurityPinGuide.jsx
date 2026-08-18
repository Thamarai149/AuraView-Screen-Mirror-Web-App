import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Smartphone, Wifi, KeyRound, Copy, Check } from 'lucide-react';

const host = (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== '') ? window.location.hostname : '127.0.0.1';
const BACKEND_API_URL = `http://${host}:8000/api`;

export default function SecurityPinGuide({ activePin, onPinRefreshed }) {
  const [currentPin, setCurrentPin] = useState(activePin || '----');
  const [hostIp, setHostIp] = useState('10.189.6.13');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPinInfo = async () => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/pin-info`);
      const data = await res.json();
      if (data.status === 'success') {
        setCurrentPin(data.pin);
        setHostIp(data.host_ip || window.location.hostname);
        if (onPinRefreshed) onPinRefreshed(data.pin);
      }
    } catch (err) {
      console.warn("Could not fetch PIN info:", err);
    }
  };

  useEffect(() => {
    fetchPinInfo();
  }, []);

  const handleRefreshPin = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${BACKEND_API_URL}/refresh-pin`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setCurrentPin(data.new_pin);
        if (onPinRefreshed) onPinRefreshed(data.new_pin);
      }
    } catch (err) {
      console.error("Failed to refresh PIN:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const mobileUrl = `http://${hostIp}:5173`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Dynamic Security PIN & Connect Guide</h3>
            <p className="text-xs text-slate-400">Mobile access authentication & step-by-step setup</p>
          </div>
        </div>

        {/* Refresh PIN Button */}
        <button
          onClick={handleRefreshPin}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all duration-200 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Generate New PIN</span>
        </button>
      </div>

      {/* PIN Display Banner */}
      <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-cyan-500/10 via-slate-900/60 to-blue-500/10">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Active 4-Digit Security PIN Code
          </span>
          <p className="text-xs text-slate-400">
            Enter this code on your mobile phone to pair & unlock live desktop stream.
          </p>
        </div>
        
        {/* Dynamic Monospace Digits */}
        <div className="flex items-center space-x-2 font-mono text-3xl font-bold tracking-widest px-5 py-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/20">
          <KeyRound className="w-6 h-6 text-amber-400 mr-1" />
          <span>{currentPin}</span>
        </div>
      </div>

      {/* Step-by-Step Mobile Connection Instructions */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mobile Phone Setup Steps</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Step 1 */}
          <div className="glass-card rounded-xl p-3.5 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono">1</span>
              <Wifi className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs font-semibold text-slate-200">Connect to Wi-Fi</p>
            <p className="text-[11px] text-slate-400">Ensure PC & Mobile are on the same Wi-Fi network.</p>
          </div>

          {/* Step 2 */}
          <div className="glass-card rounded-xl p-3.5 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono">2</span>
              <button 
                onClick={copyToClipboard}
                title="Copy Link"
                className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-200">Open Browser URL</p>
            <code className="text-[10px] font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded block truncate">
              {mobileUrl}
            </code>
          </div>

          {/* Step 3 */}
          <div className="glass-card rounded-xl p-3.5 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono">3</span>
              <KeyRound className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs font-semibold text-slate-200">Enter Security PIN</p>
            <p className="text-[11px] text-slate-400">
              Type PIN <strong className="text-cyan-300 font-mono">{currentPin}</strong> on mobile screen.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
