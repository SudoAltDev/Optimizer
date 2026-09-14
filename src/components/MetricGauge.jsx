import React from 'react';

export default function MetricGauge({ 
  value = 0, 
  maxValue = 100, 
  title = '', 
  subtitle = '', 
  icon: Icon,
  colorScheme = 'cyan', // 'cyan', 'emerald', 'purple', 'amber'
  size = 140
}) {
  const percent = Math.min(100, Math.max(0, Math.round((value / maxValue) * 100)));
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 260 degrees
  const arcLength = circumference * 0.72;
  const strokeDashoffset = arcLength - (arcLength * percent) / 100;

  const colorMap = {
    cyan: {
      stroke: 'url(#cyanGradient)',
      text: 'text-cyan-400',
      glow: 'shadow-neon-cyan',
      bg: 'stroke-cyan-950/40',
      accent: '#00f0ff'
    },
    purple: {
      stroke: 'url(#purpleGradient)',
      text: 'text-purple-400',
      glow: 'shadow-neon-purple',
      bg: 'stroke-purple-950/40',
      accent: '#a855f7'
    },
    emerald: {
      stroke: 'url(#emeraldGradient)',
      text: 'text-emerald-400',
      glow: 'shadow-neon-emerald',
      bg: 'stroke-emerald-950/40',
      accent: '#10b981'
    },
    amber: {
      stroke: 'url(#amberGradient)',
      text: 'text-amber-400',
      glow: 'shadow-sm',
      bg: 'stroke-amber-950/40',
      accent: '#f59e0b'
    }
  };

  const currentTheme = percent > 85 ? {
    stroke: 'url(#redGradient)',
    text: 'text-red-400',
    glow: 'shadow-neon-red',
    bg: 'stroke-red-950/40',
    accent: '#ef4444'
  } : colorMap[colorScheme] || colorMap.cyan;

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className={currentTheme.bg}
            strokeWidth="8"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={currentTheme.stroke}
            strokeWidth="8"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {Icon && <Icon className={`w-4 h-4 mb-0.5 ${currentTheme.text}`} />}
          <div className="flex items-baseline">
            <span className={`text-2xl font-extrabold font-mono tracking-tight ${currentTheme.text}`}>
              {percent}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400 ml-0.5">%</span>
          </div>
          {title && (
            <span className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase mt-0.5">
              {title}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <span className="text-xs font-mono text-slate-400 mt-1">
          {subtitle}
        </span>
      )}
    </div>
  );
}
