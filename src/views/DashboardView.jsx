import React, { useState, useEffect } from 'react';
import MetricGauge from '../components/MetricGauge';
import StatCard from '../components/StatCard';
import { 
  Zap, 
  Cpu, 
  Activity, 
  Flame, 
  Trash2, 
  ShieldCheck, 
  CheckCircle, 
  RefreshCw, 
  Sparkles, 
  Server, 
  Gamepad2, 
  Layers 
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardView({ 
  status, 
  telemetry, 
  onRefresh, 
  showToast,
  setActiveTab,
  showWaveform = true
}) {
  const [boosting, setBoosting] = useState(false);
  const [boostStep, setBoostStep] = useState('');
  const [history, setHistory] = useState(() => Array(18).fill({ cpu: 15, ram: 35 }));
  const [recentLogs, setRecentLogs] = useState([
    { id: 1, text: 'AltOptimizer background engine active with Win32 NT hooks', time: 'Just now' },
    { id: 2, text: 'Real-time telemetry stream synchronized via WebSocket', time: '1m ago' }
  ]);

  const cpuPercent = telemetry?.cpu ?? status?.cpu?.percent ?? 15;
  const ramPercent = telemetry?.ram?.percent ?? status?.ram?.percent ?? 32;
  const ramUsedGB = telemetry?.ram?.usedGB ?? status?.ram?.usedGB ?? '5.2';
  const ramTotalGB = telemetry?.ram?.totalGB ?? status?.ram?.totalGB ?? '15.8';
  const ramAvailGB = telemetry?.ram?.availGB ?? status?.ram?.availGB ?? '10.6';

  const healthScore = status?.healthScore ?? 90;

  useEffect(() => {
    if (telemetry) {
      setHistory(prev => [
        ...prev.slice(1),
        { cpu: telemetry.cpu || 15, ram: telemetry.ram?.percent || 35 }
      ]);
    }
  }, [telemetry]);

  const handleMasterBoost = async () => {
    if (boosting) return;
    setBoosting(true);
    setBoostStep('Purging Standby RAM list & trimming working sets...');

    try {
      setTimeout(() => setBoostStep('Sweeping Windows temp, caches & shader buffers...'), 600);
      setTimeout(() => setBoostStep('Optimizing network latency & DNS resolver...'), 1200);

      const res = await api.masterBoost();

      setTimeout(() => {
        setBoosting(false);
        setBoostStep('');
        const freedMB = res.totalFreedMB || '0';
        showToast({
          type: 'success',
          title: 'AltOptimizer Boost Complete!',
          message: `Reclaimed ${freedMB} MB of memory and disk cache across all system subsystems.`
        });
        setRecentLogs(prev => [
          { id: Date.now(), text: `Master Turbo Boost reclaimed ${freedMB} MB RAM & storage`, time: 'Just now' },
          ...prev.slice(0, 4)
        ]);
        onRefresh();
      }, 1800);
    } catch (err) {
      setBoosting(false);
      setBoostStep('');
      showToast({
        type: 'error',
        title: 'Boost Failed',
        message: err.message
      });
    }
  };

  const handleQuickRamPurge = async () => {
    try {
      const res = await api.optimizeRam('--all');
      const mb = res.freedBytes ? (res.freedBytes / (1024 * 1024)).toFixed(1) : '0';
      showToast({
        type: 'success',
        title: 'RAM Turbo Complete',
        message: `Trimmed ${res.workingSetsTrimmed || 0} process working sets. Reclaimed ${mb} MB.`
      });
      setRecentLogs(prev => [
        { id: Date.now(), text: `Quick RAM Purge freed ${mb} MB RAM across ${res.workingSetsTrimmed} processes`, time: 'Just now' },
        ...prev.slice(0, 4)
      ]);
      onRefresh();
    } catch (err) {
      showToast({ type: 'error', title: 'RAM Purge Failed', message: err.message });
    }
  };

  // SVG waveform points
  const chartWidth = 500;
  const chartHeight = 80;
  const cpuPoints = history.map((pt, i) => {
    const x = (i / (history.length - 1)) * chartWidth;
    const y = chartHeight - (pt.cpu / 100) * (chartHeight - 12) - 6;
    return `${x},${y}`;
  }).join(' ');

  const ramPoints = history.map((pt, i) => {
    const x = (i / (history.length - 1)) * chartWidth;
    const y = chartHeight - (pt.ram / 100) * (chartHeight - 12) - 6;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-h-full">
      {/* Header Banner */}
      <div className="relative rounded-2xl glass-panel p-6 overflow-hidden shadow-xl border-[var(--border-color)]">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--border-color)] text-[var(--text-muted)] text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>AltOptimizer Engine Active</span>
            </div>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
                System Accelerator & Game Booster
              </h1>
              <p className="text-xs md:text-sm text-[var(--text-muted)] max-w-xl leading-relaxed mt-1">
                Zero out cached Standby RAM, sweep deep temporary junk repositories, and allocate maximum processor priority to active gaming sessions.
              </p>
            </div>

            {/* Hardware Rig Specs Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-[var(--text-dim)]">
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                {status?.cpu?.model || 'AMD Ryzen Processor'} ({status?.cpu?.cores || 16} Cores)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                {ramTotalGB} GB RAM Architecture
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                {status?.platform === 'win32' ? 'Windows 11' : status?.platform} ({status?.hostname || 'Host'})
              </span>
            </div>
          </div>

          {/* Master Boost Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleMasterBoost}
              disabled={boosting}
              className={`relative group w-40 h-40 rounded-full p-2 flex flex-col items-center justify-center transition-all duration-300 select-none ${
                boosting
                  ? 'cursor-wait scale-95 opacity-90'
                  : 'hover:scale-105 active:scale-95 cursor-pointer'
              }`}
            >
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-[var(--border-hover)] energy-pulse" />
              
              {/* Inner Core */}
              <div className="w-full h-full rounded-full cyber-btn-primary flex flex-col items-center justify-center p-4 text-center">
                {boosting ? (
                  <RefreshCw className="w-9 h-9 animate-spin mb-1 stroke-[2.5]" />
                ) : (
                  <Zap className="w-10 h-10 mb-1 group-hover:scale-110 transition-transform stroke-[2.5]" />
                )}
                <span className="font-extrabold text-sm tracking-wide uppercase">
                  {boosting ? 'Optimizing' : 'Turbo Boost'}
                </span>
                <span className="text-[10px] font-mono tracking-tight opacity-90 uppercase">
                  {boosting ? 'Flushing Cache' : '1-Click Clean'}
                </span>
              </div>
            </button>

            {boosting && (
              <span className="text-xs font-mono text-[var(--accent-primary)] mt-2 animate-pulse text-center max-w-xs">
                {boostStep}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Telemetry Dials & Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-2.5 left-3 text-[10px] font-mono uppercase text-[var(--text-dim)] font-semibold">
            Processor Load
          </div>
          <MetricGauge 
            value={cpuPercent} 
            title="CPU LOAD" 
            subtitle={`${status?.cpu?.cores || 16} Cores Active`} 
            colorScheme="cyan"
            icon={Cpu}
          />
        </div>

        <div className="glass-panel p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-2.5 left-3 text-[10px] font-mono uppercase text-[var(--text-dim)] font-semibold">
            Memory Footprint
          </div>
          <MetricGauge 
            value={ramPercent} 
            title="RAM USAGE" 
            subtitle={`${ramUsedGB} GB / ${ramTotalGB} GB`} 
            colorScheme={ramPercent > 75 ? 'amber' : 'purple'}
            icon={Activity}
          />
        </div>

        <div className="glass-panel p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-2.5 left-3 text-[10px] font-mono uppercase text-[var(--text-dim)] font-semibold">
            Available Physical RAM
          </div>
          <MetricGauge 
            value={Math.round((parseFloat(ramAvailGB) / Math.max(1, parseFloat(ramTotalGB))) * 100)} 
            title="AVAILABLE" 
            subtitle={`${ramAvailGB} GB Clean RAM`} 
            colorScheme="emerald"
            icon={Flame}
          />
        </div>

        <div className="glass-panel p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-2.5 left-3 text-[10px] font-mono uppercase text-[var(--text-dim)] font-semibold">
            Optimization Score
          </div>
          <MetricGauge 
            value={healthScore} 
            title="SCORE" 
            subtitle={healthScore > 80 ? 'Optimal State' : 'Junk Detected'} 
            colorScheme={healthScore > 80 ? 'emerald' : 'amber'}
            icon={ShieldCheck}
          />
        </div>
      </div>

      {/* Live Waveform History (Toggled via Settings) */}
      {showWaveform && (
        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-primary)]" />
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                Hardware Frequency & Telemetry Waveform
              </h3>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-[var(--text-muted)]">CPU: {cpuPercent}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span className="text-[var(--text-muted)]">RAM: {ramPercent}%</span>
              </div>
            </div>
          </div>

          {/* SVG Waveform Chart */}
          <div className="w-full h-20 bg-[var(--bg-main)] rounded-xl p-2 border border-[var(--border-color)] relative overflow-hidden">
            <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="ramGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2={chartWidth} y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

              <polygon points={`0,${chartHeight} ${cpuPoints} ${chartWidth},${chartHeight}`} fill="url(#cpuGradient)" />
              <polyline points={cpuPoints} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              <polygon points={`0,${chartHeight} ${ramPoints} ${chartWidth},${chartHeight}`} fill="url(#ramGradient)" />
              <polyline points={ramPoints} fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      {/* Quick Action Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Cpu}
          title="Standby RAM Purger"
          value={`${ramAvailGB} GB Clean`}
          subtitle="Flush inactive standby file lists"
          badge="NT Native"
          badgeType="purple"
          actionLabel="Purge Standby Now"
          onAction={handleQuickRamPurge}
        />

        <StatCard
          icon={Trash2}
          title="Deep Junk Cleaner"
          value="12 Repositories"
          subtitle="Temp, Prefetch, Thumbnails, Shader"
          badge="Safe Scan"
          badgeType="cyan"
          actionLabel="View Junk Files"
          onAction={() => setActiveTab('cleaner')}
        />

        <StatCard
          icon={Gamepad2}
          title="EXE Runner & Booster"
          value="Game Presets"
          subtitle="Custom Profiles & Priority Tuning"
          badge="Ready"
          badgeType="emerald"
          actionLabel="Open EXE Runner"
          onAction={() => setActiveTab('game')}
        />
      </div>

      {/* Live Activity Feed */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
              Optimization Engine Feed
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-dim)]">
            Standby Monitor Active
          </span>
        </div>

        <div className="space-y-2">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-mono"
            >
              <div className="flex items-center gap-2.5 text-[var(--text-muted)]">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{log.text}</span>
              </div>
              <span className="text-[11px] text-[var(--text-dim)] flex-shrink-0">
                {log.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
