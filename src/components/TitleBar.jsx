import React from 'react';
import { Zap, ShieldCheck, ShieldAlert, Minus, Square, X } from 'lucide-react';

export default function TitleBar({ isAdmin, onElevate }) {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  const handleMinimize = () => {
    if (isElectron) window.electronAPI.minimize();
  };

  const handleMaximize = () => {
    if (isElectron) window.electronAPI.maximize();
  };

  const handleClose = () => {
    if (isElectron) window.electronAPI.close();
  };

  return (
    <div className="h-10 w-full border-b border-[var(--border-color)] bg-[var(--bg-topbar)] flex items-center justify-between px-3.5 select-none app-drag-region z-50 transition-colors">
      {/* Brand */}
      <div className="flex items-center gap-2.5 app-no-drag">
        <img 
          src="/logo.png" 
          alt="AltOptimizer Logo" 
          className="w-5 h-5 object-contain rounded-sm" 
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span className="font-bold text-xs tracking-tight text-[var(--text-main)]">
          AltOptimizer
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--border-color)] text-[var(--text-muted)]">
          v1.0 Pro
        </span>
      </div>

      {/* Admin Status & Window Controls */}
      <div className="flex items-center gap-3 app-no-drag">
        {isAdmin ? (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Administrator Active</span>
          </div>
        ) : (
          <button
            onClick={onElevate}
            title="Click to elevate to Administrator for deep NT memory management"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400 text-[11px] font-medium transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Run as Admin</span>
          </button>
        )}

        {/* Window Controls (shown in Electron) */}
        {isElectron && (
          <div className="flex items-center -mr-1">
            <button
              onClick={handleMinimize}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600/90 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
