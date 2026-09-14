import React from 'react';
import { 
  Gauge, 
  Trash2, 
  Cpu, 
  Gamepad2, 
  Sliders, 
  Settings,
  Activity,
  Globe,
  Send,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, healthScore, telemetry }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Gauge, badge: null },
    { id: 'cleaner', label: 'Junk & Cache', icon: Trash2, badge: '12 Cleaners' },
    { id: 'ram', label: 'RAM Turbo', icon: Cpu, badge: 'NT Purge' },
    { id: 'game', label: 'Game Booster', icon: Gamepad2, badge: 'EXE Boost' },
    { id: 'tweaks', label: 'Hardware Engine', icon: Sliders, badge: 'Tuning' },
    { id: 'settings', label: 'Settings & Theme', icon: Settings, badge: null },
  ];

  const ramUsed = telemetry?.ram?.usedGB || '5.2';
  const ramTotal = telemetry?.ram?.totalGB || '15.8';

  return (
    <aside className="w-64 h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col justify-between p-3.5 select-none flex-shrink-0 z-20 transition-colors">
      {/* Top Navigation */}
      <div className="space-y-3">
        <div className="px-3 py-1 flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-[var(--text-dim)] font-semibold">
          <span>Control Panel</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <span className="text-[10px] text-[var(--accent-primary)] font-mono">Live</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left relative overflow-hidden group cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bg-card-hover)] text-[var(--accent-primary)] border border-[var(--border-hover)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] border border-transparent'
                }`}
              >
                {/* Active Indicator Bar on left */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--accent-primary)]" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-dim)] group-hover:text-[var(--text-main)]'
                  }`} />
                  <span className="tracking-tight whitespace-nowrap truncate font-medium">
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono whitespace-nowrap flex-shrink-0 ml-2 ${
                    isActive 
                      ? 'bg-[var(--border-color)] text-[var(--accent-primary)] font-bold' 
                      : 'bg-black/25 text-[var(--text-dim)]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Widget: Optimization & Author Info */}
      <div className="space-y-3">
        {/* Health Score Box */}
        <div className="glass-panel p-3.5 border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              Optimization Status
            </span>
            <span className={`text-xs font-bold font-mono ${
              healthScore > 80 ? 'text-emerald-400' : healthScore > 60 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {healthScore}%
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                healthScore > 80
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : healthScore > 60
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-500 to-red-400'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-dim)] pt-1 border-t border-[var(--border-color)]">
            <span>RAM In-Use:</span>
            <span className="text-[var(--text-main)] font-bold">{ramUsed} / {ramTotal} GB</span>
          </div>
        </div>

        {/* Sole Owner Branding Tag with Generous Spacing */}
        <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[var(--text-dim)]">Creator:</span>
            <a 
              href="https://t.me/icodx" 
              target="_blank" 
              rel="noreferrer" 
              className="font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>@icodx</span>
            </a>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-[var(--border-color)]">
            <span className="text-[var(--text-dim)]">Website:</span>
            <a
              href="https://altdev.netlify.app"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              <span>altdev.netlify.app</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
