import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Send, 
  Mail, 
  Globe, 
  Check, 
  Sliders, 
  Copy, 
  ExternalLink,
  Code2,
  Sparkles,
  Save,
  Download,
  RotateCcw,
  Sun,
  Moon
} from 'lucide-react';

export default function SettingsView({ 
  currentTheme, 
  setTheme, 
  autoRamPurge, 
  setAutoRamPurge,
  showWaveform, 
  setShowWaveform,
  showToast 
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const fullThemes = [
    { 
      id: 'obsidian', 
      name: 'Obsidian Dark', 
      desc: 'Deep blacks with ice blue accents (Default)', 
      bg: '#080a0f', 
      accent: '#38bdf8',
      type: 'dark'
    },
    { 
      id: 'cobalt', 
      name: 'Midnight Cobalt', 
      desc: 'Royal navy and deep indigo architecture', 
      bg: '#060b17', 
      accent: '#6366f1',
      type: 'dark'
    },
    { 
      id: 'titanium', 
      name: 'Dark Titanium', 
      desc: 'Neutral gunmetal slate with teal highlights', 
      bg: '#0e0f12', 
      accent: '#14b8a6',
      type: 'dark'
    },
    { 
      id: 'crimson', 
      name: 'Crimson Eclipse', 
      desc: 'Deep charcoal with ruby and rose styling', 
      bg: '#0c090c', 
      accent: '#f43f5e',
      type: 'dark'
    },
    { 
      id: 'nordic', 
      name: 'Nordic Clean Light', 
      desc: 'Pristine frosted white & light slate interface', 
      bg: '#f8fafc', 
      accent: '#0284c7',
      type: 'light'
    },
  ];

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: `${text} copied.`
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveAllConfig = () => {
    try {
      const config = {
        theme: currentTheme,
        autoRamPurge,
        showWaveform,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('alt_config_backup', JSON.stringify(config));
      showToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Application theme and optimization preferences persisted.'
      });
    } catch (e) {
      showToast({ type: 'error', title: 'Save Failed', message: e.message });
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all appearance and telemetry settings to default?')) {
      setTheme('obsidian');
      setAutoRamPurge(false);
      setShowWaveform(true);
      showToast({ type: 'info', title: 'Reset Complete', message: 'Restored default settings.' });
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Preferences & System Themes
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure full application color palettes, telemetry visualization, and review official project credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSaveAllConfig}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl cyber-btn-primary text-xs font-bold cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Config</span>
          </button>

          <button
            onClick={handleResetDefaults}
            title="Reset settings to defaults"
            className="p-2 rounded-xl cyber-btn-secondary text-slate-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Theme Selection Grid */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Full Application Color Theme
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Active: <strong className="text-sky-300 capitalize">{currentTheme}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          {fullThemes.map((t) => {
            const isActive = currentTheme === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative flex flex-col justify-between ${
                  isActive
                    ? 'border-sky-400 bg-sky-950/20 shadow-md ring-1 ring-sky-400/40'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm" 
                        style={{ backgroundColor: t.accent }} 
                      />
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-white/20" 
                        style={{ backgroundColor: t.bg }} 
                      />
                    </div>

                    {isActive ? (
                      <Check className="w-4 h-4 text-sky-400" />
                    ) : (
                      t.type === 'light' ? (
                        <Sun className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-slate-400" />
                      )
                    )}
                  </div>

                  <div className="text-xs font-bold text-white tracking-tight">
                    {t.name}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {t.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual & Engine Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-5 space-y-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Telemetry & Engine Automation
            </h3>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div>
              <span className="text-xs font-bold text-white block">
                Dashboard Telemetry Waveform
              </span>
              <span className="text-[11px] text-slate-400 leading-snug">
                Render real-time hardware frequency curves on Dashboard
              </span>
            </div>
            <input
              type="checkbox"
              checked={showWaveform}
              onChange={(e) => setShowWaveform(e.target.checked)}
              className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div>
              <span className="text-xs font-bold text-white block">
                Automatic RAM Standby Purge
              </span>
              <span className="text-[11px] text-slate-400 leading-snug">
                Trigger standby memory flush when RAM usage exceeds 80%
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoRamPurge}
              onChange={(e) => setAutoRamPurge(e.target.checked)}
              className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Official Project & Sole Owner Credentials Card */}
        <div className="glass-panel p-5 space-y-3 bg-gradient-to-br from-slate-900/90 via-[#0d172e]/80 to-[#101938]/90 border-sky-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Official Project Credentials
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-500/40">
              100% Free & Open Source
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            AltOptimizer is an official public open-source project created and maintained exclusively by <strong className="text-white">@icodx</strong>.
          </p>

          <div className="space-y-2 pt-1 font-mono text-xs">
            {/* Telegram */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-400">Telegram:</span>
                <span className="text-white font-bold">@icodx</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('@icodx', 'tg')}
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-sans"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'tg' ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href="https://t.me/icodx"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-bold">tazarescrow@gmail.com</span>
              </div>
              <button
                onClick={() => handleCopy('tazarescrow@gmail.com', 'email')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-sans"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedKey === 'email' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Website */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Website:</span>
                <span className="text-white font-bold">altdev.netlify.app</span>
              </div>
              <a
                href="https://altdev.netlify.app"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-sans"
              >
                <span>Visit</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
