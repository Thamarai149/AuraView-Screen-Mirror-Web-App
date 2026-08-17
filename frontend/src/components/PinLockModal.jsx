import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function PinLockModal({ onVerifyPin }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDigitChange = (index, value) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 1) {
      // If user pasted or typed multiple digits
      const digits = cleaned.slice(0, 4).split('');
      const newPin = [...pin];
      digits.forEach((d, i) => {
        if (i < 4) newPin[i] = d;
      });
      setPin(newPin);
      setErrorMsg('');
      const nextIdx = Math.min(digits.length, 3);
      const nextInput = document.getElementById(`pin-digit-${nextIdx}`);
      if (nextInput) nextInput.focus();

      if (digits.length >= 4) {
        submitPin(newPin.join(''));
      }
      return;
    }

    const newPin = [...pin];
    newPin[index] = cleaned;
    setPin(newPin);
    setErrorMsg('');

    // Auto focus next input box
    if (cleaned && index < 3) {
      const nextInput = document.getElementById(`pin-digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto submit if 4th digit entered
    if (cleaned && index === 3) {
      const fullPin = newPin.join('');
      if (fullPin.length === 4) {
        submitPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const submitPin = (pinString) => {
    if (pinString.length < 4) {
      setErrorMsg('Please enter all 4 digits');
      return;
    }
    setIsSubmitting(true);
    onVerifyPin(pinString, (success, msg) => {
      setIsSubmitting(false);
      if (!success) {
        setErrorMsg(msg || 'Incorrect PIN code');
        setPin(['', '', '', '']);
        const firstInput = document.getElementById('pin-digit-0');
        if (firstInput) firstInput.focus();
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitPin(pin.join(''));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-700/60 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-b-full shadow-lg shadow-cyan-500/50"></div>

        {/* Lock Icon */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Security Access Lock</h2>
          <p className="text-xs text-slate-400 max-w-xs">
            Enter the 4-digit security PIN using your mobile or physical keyboard to unlock live stream & remote controls.
          </p>
        </div>

        {/* PIN Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center items-center space-x-3">
            {pin.map((digit, idx) => (
              <input
                key={idx}
                id={`pin-digit-${idx}`}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                autoFocus={idx === 0}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-14 h-16 text-center text-2xl font-bold font-mono bg-slate-900/80 border border-slate-700 rounded-2xl text-cyan-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none transition-all duration-150 shadow-inner"
              />
            ))}
          </div>

          {errorMsg && (
            <div className="flex items-center justify-center space-x-2 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Clean Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setPin(['', '', '', '']);
                setErrorMsg('');
                const firstInput = document.getElementById('pin-digit-0');
                if (firstInput) firstInput.focus();
              }}
              className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition-all duration-150 cursor-pointer"
            >
              Clear
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || pin.join('').length < 4}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-150 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
              ) : (
                <>
                  <span>Unlock Stream</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

