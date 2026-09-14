import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const typeConfig = {
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/90',
      text: 'text-emerald-300',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400'
    },
    error: {
      border: 'border-red-500/40',
      bg: 'bg-red-950/90',
      text: 'text-red-300',
      icon: AlertCircle,
      iconColor: 'text-red-400'
    },
    info: {
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-950/90',
      text: 'text-cyan-300',
      icon: Info,
      iconColor: 'text-cyan-400'
    }
  };

  const current = typeConfig[toast.type] || typeConfig.info;
  const Icon = current.icon;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-slide-up">
      <div className={`p-4 rounded-xl border ${current.border} ${current.bg} backdrop-blur-xl shadow-2xl flex items-start gap-3 text-sm`}>
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconColor}`} />
        <div className="flex-1 pr-2">
          <div className="font-semibold text-white">
            {toast.title || 'System Notification'}
          </div>
          {toast.message && (
            <div className={`text-xs mt-0.5 ${current.text} leading-relaxed font-mono`}>
              {toast.message}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
