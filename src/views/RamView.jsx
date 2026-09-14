import React, { useState, useEffect } from 'react';
import MetricGauge from '../components/MetricGauge';
import { 
  Cpu, 
  Flame, 
  Activity, 
  Zap, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ShieldCheck,
  Layers,
  RefreshCw,
  XCircle,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api';

export default function RamView({ status, telemetry, onRefresh, showToast }) {
  const [optimizing, setOptimizing] = useState(false);
  const [lastOptimizedResult, setLastOptimizedResult] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [actionPid, setActionPid] = useState(null);

  const ramStats = telemetry?.ram || status?.ram || {};
  const totalGB = parseFloat(ramStats.totalGB) || 16.0;
  const usedGB = parseFloat(ramStats.usedGB) || 6.0;
  const availGB = parseFloat(ramStats.availGB) || 10.0;
  const percent = ramStats.percent || Math.round((usedGB / totalGB) * 100);

  const fetchProcesses = async () => {
    setLoadingProcesses(true);
    try {
      const list = await api.getProcesses();
      setProcesses(list.slice(0, 8));
    } catch (err) {
      console.error('Failed to fetch processes in RamView:', err);
    } finally {
      setLoadingProcesses(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  const handleOptimize = async (mode = '--all') => {
    setOptimizing(true);
    try {
      const res = await api.optimizeRam(mode);
      setLastOptimizedResult(res);

      const mb = res.freedBytes ? (res.freedBytes / (1024 * 1024)).toFixed(1) : '0';
      showToast({
        type: 'success',
        title: 'Memory Cleaned!',
        message: `Freed ${mb} MB RAM. Trimmed ${res.workingSetsTrimmed || 0} process working sets.`
      });
      fetchProcesses();
      onRefresh();
    } catch (err) {
      showToast({ type: 'error', title: 'RAM Optimization Error', message: err.message });
    } finally {
      setOptimizing(false);
    }
  };

  const handleTrimProcess = async (pid, name) => {
    setActionPid(`trim-${pid}`);
    try {
      const res = await api.boostProcess(pid);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Working Set Trimmed',
          message: `${name} (PID ${pid}) working set trimmed and elevated to High Priority!`
        });
        fetchProcesses();
        onRefresh();
      } else {
        showToast({ type: 'error', title: 'Trim Failed', message: res.error });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Action Error', message: err.message });
    } finally {
      setActionPid(null);
    }
  };

  const handleEndProcess = async (pid, name) => {
    setActionPid(`kill-${pid}`);
    try {
      const res = await api.killProcess(pid);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Process Ended',
          message: `Closed ${name} (PID ${pid}) to reclaim memory.`
        });
        fetchProcesses();
        onRefresh();
      } else {
        showToast({ type: 'error', title: 'Termination Failed', message: res.error });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Action Error', message: err.message });
    } finally {
      setActionPid(null);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-h-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-[#0d1627] border border-purple-500/25">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              RAM TURBO & STANDBY CACHE PURGER
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Pushes unused memory pages back to storage and purges stale Windows Standby list caches to prevent game micro-stutters and memory allocation lag.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOptimize('--all')}
            disabled={optimizing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg cyber-btn-primary text-xs font-bold select-none cursor-pointer"
          >
            <Zap className={`w-4 h-4 ${optimizing ? 'animate-spin' : ''}`} />
            <span>{optimizing ? 'Purging RAM...' : 'Instant RAM Flush'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Memory Gauge & Multi-Segment Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Circular Gauge */}
        <div className="glass-panel p-5 flex flex-col items-center justify-center">
          <div className="text-xs font-mono uppercase text-slate-400 mb-2 font-semibold">
            Live Memory Utilization
          </div>
          <MetricGauge
            value={percent}
            title="PHYSICAL RAM"
            subtitle={`${usedGB.toFixed(1)} GB of ${totalGB.toFixed(1)} GB In-Use`}
            colorScheme="purple"
            size={160}
            icon={Activity}
          />
        </div>

        {/* Visual Memory Stack Breakdown */}
        <div className="glass-panel p-5 md:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Physical Memory Architecture
              </h3>
              <span className="text-xs font-mono text-cyan-400">
                {totalGB.toFixed(1)} GB Total
              </span>
            </div>

            {/* Segmented RAM bar */}
            <div className="w-full h-5 bg-slate-950 rounded-lg overflow-hidden flex border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
                style={{ width: `${percent}%` }}
                title={`Active Process RAM: ${usedGB.toFixed(1)} GB`}
              />
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${100 - percent}%` }}
                title={`Available / Standby: ${availGB.toFixed(1)} GB`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono mt-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                <span>Active Processes: {usedGB.toFixed(1)} GB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                <span>Available / Free: {availGB.toFixed(1)} GB</span>
              </div>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleOptimize('--purge-standby')}
              disabled={optimizing}
              className="p-3 rounded-lg bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-cyan-400">
                  Purge Standby Cache
                </span>
                <Flame className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Flushes cached file pages from Windows Standby list via NT Native API.
              </p>
            </button>

            <button
              onClick={() => handleOptimize('--empty-workingsets')}
              disabled={optimizing}
              className="p-3 rounded-lg bg-slate-900/80 border border-purple-500/30 hover:border-purple-400 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-purple-400">
                  Empty Process Working Sets
                </span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Forces background apps to release inactive memory pages.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Top Memory Consuming Processes */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Top Memory Consuming Processes
              </h3>
              <p className="text-[11px] text-slate-400">
                Active processes occupying the highest physical RAM working sets
              </p>
            </div>
          </div>

          <button
            onClick={fetchProcesses}
            disabled={loadingProcesses}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-xs font-mono text-slate-300 transition-all cursor-pointer"
            title="Refresh process list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loadingProcesses ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Process list */}
        <div className="space-y-2">
          {processes.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 font-mono">
              {loadingProcesses ? 'Scanning process working sets...' : 'No high-memory processes detected.'}
            </div>
          ) : (
            processes.map((proc, index) => {
              const maxRam = processes[0]?.ramMB || 1000;
              const barPercent = Math.min(100, Math.max(8, Math.round((proc.ramMB / maxRam) * 100)));

              return (
                <div
                  key={`${proc.pid}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[11px] font-mono text-slate-500 w-5 text-right font-bold">
                      #{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[200px]" title={proc.name}>
                          {proc.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 bg-slate-800 rounded">
                          PID {proc.pid}
                        </span>
                        {proc.isGame && (
                          <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.2 bg-emerald-950/60 border border-emerald-500/30 rounded">
                            Game
                          </span>
                        )}
                      </div>

                      {/* Memory bar */}
                      <div className="w-full bg-slate-950 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${barPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {proc.ramMB >= 1024 
                          ? `${(proc.ramMB / 1024).toFixed(2)} GB` 
                          : `${proc.ramMB.toFixed(1)} MB`}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-500">
                        {proc.threads} threads • {proc.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTrimProcess(proc.pid, proc.name)}
                        disabled={actionPid === `trim-${proc.pid}`}
                        className="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-[11px] font-bold text-purple-300 hover:text-purple-200 transition-all flex items-center gap-1 cursor-pointer"
                        title="Trim working set and elevate priority"
                      >
                        <Zap className={`w-3 h-3 text-purple-400 ${actionPid === `trim-${proc.pid}` ? 'animate-spin' : ''}`} />
                        <span>Trim</span>
                      </button>

                      <button
                        onClick={() => handleEndProcess(proc.pid, proc.name)}
                        disabled={actionPid === `kill-${proc.pid}`}
                        className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-all flex items-center gap-1 cursor-pointer"
                        title="End Task to free RAM"
                      >
                        <XCircle className="w-3 h-3 text-rose-400" />
                        <span>End</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info card: Why Standby RAM matters */}
      <div className="glass-panel p-4 bg-slate-900/40 border-cyan-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed space-y-1">
            <span className="font-semibold text-white">How AltOptimizer RAM Turbo works:</span>
            <p>
              Windows caches files read from disk into the "Standby list" in memory. When launching high-performance 3D games or memory-intensive applications, Windows must purge these standby pages on the fly, which can lead to micro-stutters and frame drops.
            </p>
            <p className="text-cyan-300/90 font-mono">
              Purging the Standby list and trimming inactive working sets gives games instant access to clean, zeroed physical memory blocks.
            </p>
          </div>
        </div>
      </div>

      {/* Optimization Result Details (if executed) */}
      {lastOptimizedResult && (
        <div className="glass-panel p-4 bg-emerald-950/20 border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Last Optimization Telemetry
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Processes Trimmed</span>
              <span className="text-white font-bold text-sm">
                {lastOptimizedResult.workingSetsTrimmed || 0}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Memory Reclaimed</span>
              <span className="text-emerald-400 font-bold text-sm">
                {((lastOptimizedResult.freedBytes || 0) / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">RAM Before / After</span>
              <span className="text-white font-bold text-sm">
                {lastOptimizedResult.ramBefore?.loadPercent}% → {lastOptimizedResult.ramAfter?.loadPercent}%
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">NT API Status</span>
              <span className="text-cyan-400 font-bold text-sm">
                {lastOptimizedResult.standbyPurged ? 'Flushed' : 'Working Sets Trimmed'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
