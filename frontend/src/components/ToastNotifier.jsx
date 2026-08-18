import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Global Toast Context ───────────────────────────────────────────────────
let _addToast = null;

export function toast(message, type = 'info', duration = 4000) {
  if (_addToast) _addToast(message, type, duration);
}

export function useToast() {
  return { toast };
}

// ─── Individual Toast Item ──────────────────────────────────────────────────
function ToastItem({ id, message, type, duration, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(id), 300);
  };

  const styles = {
    success: {
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/10',
      icon: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
      progress: 'bg-emerald-500',
      text: 'text-emerald-300',
    },
    error: {
      border: 'border-rose-500/50',
      bg: 'bg-rose-500/10',
      icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
      progress: 'bg-rose-500',
      text: 'text-rose-300',
    },
    warning: {
      border: 'border-amber-500/50',
      bg: 'bg-amber-500/10',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
      progress: 'bg-amber-500',
      text: 'text-amber-300',
    },
    info: {
      border: 'border-cyan-500/50',
      bg: 'bg-cyan-500/10',
      icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
      progress: 'bg-cyan-500',
      text: 'text-cyan-300',
    },
  };

  const s = styles[type] || styles.info;

  return (
    <div
      className={`relative w-80 rounded-xl glass-panel border ${s.border} ${s.bg} shadow-2xl overflow-hidden ${isExiting ? 'toast-exit' : 'toast-enter'}`}
    >
      <div className="flex items-start gap-3 p-3.5">
        {s.icon}
        <p className={`flex-1 text-xs font-medium leading-relaxed ${s.text}`}>{message}</p>
        <button
          onClick={handleDismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer shrink-0 mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-slate-800/60">
        <div
          className={`h-full ${s.progress} toast-progress`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}

// ─── Toast Container (mounts in top-right corner) ───────────────────────────
export default function ToastNotifier() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const addToast = useCallback((message, type, duration) => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Register globally
  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
