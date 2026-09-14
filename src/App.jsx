import React, { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import DashboardView from './views/DashboardView';
import CleanerView from './views/CleanerView';
import RamView from './views/RamView';
import GameBoosterView from './views/GameBoosterView';
import TweaksView from './views/TweaksView';
import SettingsView from './views/SettingsView';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [toast, setToast] = useState(null);

  // User Preferences
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('alt_theme');
    // Normalize old theme names to new full themes
    if (!saved || saved === 'cyan') return 'obsidian';
    if (saved === 'purple') return 'cobalt';
    if (saved === 'emerald') return 'titanium';
    return saved;
  });
  const [showWaveform, setShowWaveform] = useState(() => localStorage.getItem('alt_waveform') !== 'false');
  const [autoRamPurge, setAutoRamPurge] = useState(() => localStorage.getItem('alt_autopurge') === 'true');

  const fetchStatus = async () => {
    try {
      const data = await api.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Connect real-time WebSocket telemetry stream
    const disconnect = api.connectTelemetry((data) => {
      setTelemetry(data);

      // Auto-purge RAM if enabled and RAM load exceeds 80%
      if (autoRamPurge && data.ram?.percent > 80) {
        api.optimizeRam('--all').catch(() => {});
      }
    });

    return () => {
      if (disconnect) disconnect();
    };
  }, [autoRamPurge]);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('alt_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('alt_waveform', showWaveform.toString());
  }, [showWaveform]);

  useEffect(() => {
    localStorage.setItem('alt_autopurge', autoRamPurge.toString());
  }, [autoRamPurge]);

  const showToast = (toastObj) => {
    setToast(toastObj);
  };

  const handleElevate = () => {
    if (window.electronAPI?.elevate) {
      window.electronAPI.elevate();
    } else {
      showToast({
        type: 'info',
        title: 'Administrator Elevation',
        message: 'Launch AltOptimizer using launch.bat or launch-desktop.bat to automatically elevate to Administrator.'
      });
    }
  };

  const isElectronAdmin = (typeof window !== 'undefined' && window.electronAPI?.isAdmin)
    ? Boolean(window.electronAPI.isAdmin())
    : false;
  const isAdmin = isElectronAdmin || Boolean(status?.admin?.isAdmin);
  const healthScore = status?.healthScore || 90;

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-sans transition-colors duration-200"
      data-theme={theme}
    >
      {/* Frameless Top Window Bar */}
      <TitleBar 
        isAdmin={isAdmin} 
        onElevate={handleElevate} 
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          healthScore={healthScore}
          telemetry={telemetry}
        />

        {/* Dynamic View Display */}
        <main className="flex-1 overflow-hidden bg-[var(--bg-main)] relative transition-colors duration-200">
          {activeTab === 'dashboard' && (
            <DashboardView 
              status={status} 
              telemetry={telemetry} 
              onRefresh={fetchStatus} 
              showToast={showToast}
              setActiveTab={setActiveTab}
              showWaveform={showWaveform}
            />
          )}

          {activeTab === 'cleaner' && (
            <CleanerView 
              showToast={showToast}
            />
          )}

          {activeTab === 'ram' && (
            <RamView 
              status={status} 
              telemetry={telemetry} 
              onRefresh={fetchStatus} 
              showToast={showToast}
            />
          )}

          {activeTab === 'game' && (
            <GameBoosterView 
              showToast={showToast}
            />
          )}

          {activeTab === 'tweaks' && (
            <TweaksView 
              status={status} 
              onRefresh={fetchStatus} 
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              currentTheme={theme}
              setTheme={setTheme}
              autoRamPurge={autoRamPurge}
              setAutoRamPurge={setAutoRamPurge}
              showWaveform={showWaveform}
              setShowWaveform={setShowWaveform}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Toast Notifications */}
      <Toast 
        toast={toast} 
        onClose={() => setToast(null)} 
      />
    </div>
  );
}
