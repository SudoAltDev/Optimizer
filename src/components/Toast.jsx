import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef(null);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 280);
  };

  useEffect(() => {
    if (!toast) {
      setIsClosing(false);
      return;
    }
    setIsClosing(false);

    // Auto-dismiss after 4.2s with smooth liquid disappear animation
    timerRef.current = setTimeout(() => {
      handleClose();
    }, 4200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  if (!toast) return null;

  const typeConfig = {
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/75',
      badgeBg: 'bg-emerald-500/15',
      badgeBorder: 'border-emerald-400/30',
      text: 'text-emerald-300',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400'
    },
    error: {
      border: 'border-red-500/40',
      bg: 'bg-red-950/75',
      badgeBg: 'bg-red-500/15',
      badgeBorder: 'border-red-400/30',
      text: 'text-red-300',
      icon: AlertCircle,
      iconColor: 'text-red-400',
      barColor: 'bg-gradient-to-r from-red-500 to-rose-400'
    },
    info: {
      border: 'border-sky-500/40',
      bg: 'bg-slate-900/80',
      badgeBg: 'bg-sky-500/15',
      badgeBorder: 'border-sky-400/30',
      text: 'text-sky-300',
      icon: Info,
      iconColor: 'text-sky-400',
      barColor: 'bg-gradient-to-r from-sky-500 to-cyan-400'
    }
  };

  const current = typeConfig[toast.type] || typeConfig.info;
  const Icon = current.icon;

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 max-w-md ${
        isClosing ? 'animate-liquid-disappear' : 'animate-liquid-appear'
      }`}
    >
      <div 
        className={`relative overflow-hidden p-4 rounded-2xl border ${current.border} ${current.bg} backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.65),inset_0_1px_1.5px_rgba(255,255,255,0.25)] flex items-start gap-3.5 text-sm select-none transition-all`}
      >
        <div className={`p-2 rounded-xl ${current.badgeBg} border ${current.badgeBorder} flex-shrink-0 mt-0.5 shadow-sm`}>
          <Icon className={`w-4 h-4 ${current.iconColor}`} />
        </div>
        
        <div className="flex-1 pr-2">
          <div className="font-semibold text-white tracking-wide flex items-center gap-1.5">
            {toast.title || 'System Notification'}
          </div>
          {toast.message && (
            <div className={`text-xs mt-1 ${current.text} leading-relaxed font-mono opacity-90`}>
              {toast.message}
            </div>
          )}
        </div>

        <button
          onClick={handleClose}
          title="Dismiss notification"
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Liquid Progress Timer Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black/30 overflow-hidden">
          <div 
            className={`h-full ${current.barColor} shadow-[0_0_8px_currentColor]`}
            style={{
              animation: 'toast-progress 4.2s linear forwards'
            }}
          />
        </div>
      </div>
    </div>
  );
}
