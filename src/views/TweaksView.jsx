import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Zap, 
  Wifi, 
  HardDrive, 
  ShieldCheck, 
  CheckCircle2, 
  Flame, 
  Sparkles,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';

export default function TweaksView({ status, onRefresh, showToast }) {
  const [tweaks, setTweaks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTweaks = async () => {
    setLoading(true);
    try {
      const data = await api.getTweaks();
      setTweaks(data);
    } catch (err) {
      showToast({ type: 'error', title: 'Error Fetching Tweaks', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweaks();
  }, []);

  const handleActivatePowerPlan = async () => {
    setActionLoading('power');
    try {
      const res = await api.activatePowerPlan();
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Power Plan Activated!',
          message: res.message || 'Ultimate Performance power scheme applied successfully.'
        });
        fetchTweaks();
        onRefresh();
      } else {
        showToast({ type: 'error', title: 'Power Plan Failed', message: res.error });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Action Error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOptimizeNetwork = async () => {
    setActionLoading('network');
    try {
      const res = await api.optimizeNetwork();
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Network Optimized!',
          message: (res.details || []).join(' ') || 'TCP auto-tuning enabled and DNS resolver flushed.'
        });
        fetchTweaks();
      } else {
        showToast({ type: 'error', title: 'Network Tuning Failed', message: res.error });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Action Error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOptimizeLatency = async () => {
    setActionLoading('latency');
    try {
      const res = await api.optimizeLatency();
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Gaming Latency Optimized!',
          message: res.message || 'SystemResponsiveness set to 0% reserve, network throttling disabled.'
        });
      } else {
        showToast({ type: 'error', title: 'Latency Tuning Failed', message: res.error });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Action Error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const isUltimate = tweaks?.isHighPerformance || status?.power?.isHighPerformance;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-[#0f172a] via-[#091b2c] to-[#0a192f] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              SYSTEM & HARDWARE ENGINE TWEAKS
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Tune low-level Windows hardware parameters: unthrottle processor states, optimize network packet throughput, and maintain peak NVMe/SSD read speeds.
          </p>
        </div>

        <button
          onClick={fetchTweaks}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg cyber-btn-secondary text-xs font-semibold select-none cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tweaks</span>
        </button>
      </div>

      {/* Tweaks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Power Plan Optimizer */}
        <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Ultimate Performance Scheme
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Current: {tweaks?.powerPlan || status?.power?.currentPlan || 'Balanced'}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isUltimate 
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                  : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
              }`}>
                {isUltimate ? 'Active' : 'Not Active'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Unlocks the hidden OEM Ultimate Performance power scheme. Disables core parking, CPU frequency downscaling, and device sleep delays to eliminate input latency.
            </p>
          </div>

          <button
            onClick={handleActivatePowerPlan}
            disabled={actionLoading === 'power' || isUltimate}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all select-none flex items-center justify-center gap-2 ${
              isUltimate
                ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 cursor-default'
                : 'cyber-btn-primary cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isUltimate ? 'Ultimate Performance Active' : 'Activate Ultimate Performance'}</span>
          </button>
        </div>

        {/* Network & DNS Accelerator */}
        <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Network & TCP Auto-Tuning
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-400">
                    Low-Latency Gaming Mode
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-cyan-950/80 border-cyan-500/40 text-cyan-300">
                Optimized
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sets TCP Window Auto-Tuning to Normal for full bandwidth utilization, flushes stale DNS resolver cache entries, and activates Receive Side Scaling (RSS).
            </p>
          </div>

          <button
            onClick={handleOptimizeNetwork}
            disabled={actionLoading === 'network'}
            className="w-full py-2.5 rounded-lg cyber-btn-secondary text-xs font-bold transition-all select-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className={`w-4 h-4 text-cyan-400 ${actionLoading === 'network' ? 'animate-spin' : ''}`} />
            <span>{actionLoading === 'network' ? 'Optimizing Packets...' : 'Flush DNS & Optimize TCP'}</span>
          </button>
        </div>

        {/* Windows Gaming Latency & Telemetry Suppressor */}
        <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Gaming Latency & Telemetry Suppressor
                  </h3>
                  <span className="text-[11px] font-mono text-amber-400">
                    SystemResponsiveness = 0
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-amber-950/80 border-amber-500/40 text-amber-300">
                Low Latency
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Disables the 20% CPU multimedia reserve, unlocks unlimited network packet throughput via NetworkThrottlingIndex, and halts background DiagTrack telemetry.
            </p>
          </div>

          <button
            onClick={handleOptimizeLatency}
            disabled={actionLoading === 'latency'}
            className="w-full py-2.5 rounded-lg cyber-btn-secondary text-xs font-bold transition-all select-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className={`w-4 h-4 text-amber-400 ${actionLoading === 'latency' ? 'animate-spin' : ''}`} />
            <span>{actionLoading === 'latency' ? 'Applying Latency Engine...' : 'Suppress Latency & Telemetry'}</span>
          </button>
        </div>

        {/* Windows Gaming Responsiveness */}
        <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Gaming Priority Scheduler
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Win32 Quantum Tuning
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-950/80 border-emerald-500/40 text-emerald-300">
                Enhanced
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Configures thread scheduling quanta to prioritize foreground gaming applications over background maintenance tasks, reducing frametime variance.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Foreground Boost: Maximum</span>
            <span className="text-emerald-400 font-bold">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
