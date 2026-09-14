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
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {title}
            </h4>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {value}
            </div>
          </div>
        </div>

        {badge && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeStyles[badgeType] || badgeStyles.cyan}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
        <span className="text-xs text-slate-400 font-mono">
          {subtitle}
        </span>
        {actionLabel && (
          <button
            onClick={onAction}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
          >
            {actionLabel} →
          </button>
        )}
      </div>
    </div>
  );
}
