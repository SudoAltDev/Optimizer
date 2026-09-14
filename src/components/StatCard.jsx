import React from 'react';

export default function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  badge, 
  badgeType = 'cyan', // 'cyan', 'emerald', 'purple', 'amber'
  actionLabel, 
  onAction 
}) {
  const badgeStyles = {
    cyan: 'bg-cyan-950/70 border-cyan-500/30 text-cyan-400',
    emerald: 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400',
    purple: 'bg-purple-950/70 border-purple-500/30 text-purple-400',
    amber: 'bg-amber-950/70 border-amber-500/30 text-amber-400',
  };

  return (
    <div className="glass-panel glass-panel-hover p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider truncate">
              {title}
            </h4>
            <div className="text-lg font-bold font-mono text-white mt-0.5 truncate">
              {value}
            </div>
          </div>
        </div>

        {badge && (
          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border whitespace-nowrap flex-shrink-0 tracking-wide ${badgeStyles[badgeType] || badgeStyles.cyan}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 mt-2 gap-2 text-xs font-mono">
        <span className="text-slate-400 truncate min-w-0" title={subtitle}>
          {subtitle}
        </span>
        {actionLabel && (
          <button
            onClick={onAction}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer flex items-center gap-1"
          >
            <span>{actionLabel}</span>
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
