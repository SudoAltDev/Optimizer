import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Search, 
  Zap, 
  Play, 
  XOctagon, 
  RefreshCw, 
  FolderOpen, 
  Activity, 
  CheckCircle, 
  Flame,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  Cpu,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function GameBoosterView({ showToast }) {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'games', 'heavy'
  const [actionPid, setActionPid] = useState(null);

  // Saved Presets List
  const [presets, setPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('alt_game_presets');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default initial template if empty
    return [];
  });

  // Modal / Form state for adding custom preset
  const [showAddModal, setShowAddModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetPath, setPresetPath] = useState('');
  const [presetArgs, setPresetArgs] = useState('');
  const [presetPurgeRam, setPresetPurgeRam] = useState(true);
  const [presetHighPriority, setPresetHighPriority] = useState(true);
  const [presetTrimBackground, setPresetTrimBackground] = useState(true);
  const [presetUltimatePower, setPresetUltimatePower] = useState(true);

  const [launchingId, setLaunchingId] = useState(null);

  // Save presets to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('alt_game_presets', JSON.stringify(presets));
    } catch (e) {}
  }, [presets]);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const list = await api.getProcesses();
      setProcesses(list);
    } catch (err) {
      showToast({ type: 'error', title: 'Process Radar Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleBrowseExe = async () => {
    if (window.electronAPI?.selectFile) {
      const path = await window.electronAPI.selectFile();
      if (path) {
        setPresetPath(path);
        if (!presetName) {
          // Extract base filename as default preset name
          const fileName = path.split('\\').pop().split('/').pop().replace(/\.exe$/i, '');
          setPresetName(fileName);
        }
      }
    } else {
      const input = prompt('Enter absolute path to application .exe file:', 'C:\\Windows\\System32\\notepad.exe');
      if (input) {
        setPresetPath(input);
        if (!presetName) {
          const fileName = input.split('\\').pop().replace(/\.exe$/i, '');
          setPresetName(fileName);
        }
      }
    }
  };

  const handleSavePreset = (e) => {
    e?.preventDefault();
    if (!presetName.trim() || !presetPath.trim()) {
      showToast({ type: 'error', title: 'Missing Information', message: 'Please provide a name and valid executable file path.' });
      return;
    }

    const newPreset = {
      id: Date.now(),
      name: presetName.trim(),
      path: presetPath.trim(),
      args: presetArgs.trim(),
      purgeRam: presetPurgeRam,
      highPriority: presetHighPriority,
      trimBackground: presetTrimBackground,
      ultimatePower: presetUltimatePower,
      createdAt: new Date().toLocaleDateString()
    };

    setPresets(prev => [newPreset, ...prev]);
    setShowAddModal(false);
    setPresetName('');
    setPresetPath('');
    setPresetArgs('');

    showToast({
      type: 'success',
      title: 'Preset Saved',
      message: `Profile "${newPreset.name}" created and saved to configuration.`
    });
  };

  const handleDeletePreset = (id, name) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    showToast({
      type: 'info',
      title: 'Preset Removed',
      message: `Profile "${name}" was deleted.`
    });
  };

  const handleLaunchPreset = async (preset) => {
    setLaunchingId(preset.id);
    try {
      // 1. Power plan boost if configured
      if (preset.ultimatePower) {
        await api.activatePowerPlan().catch(() => {});
      }

      // 2. RAM purge if configured
      if (preset.purgeRam || preset.trimBackground) {
        await api.optimizeRam('--all').catch(() => {});
      }

      // 3. Launch application
      const argsArray = preset.args ? preset.args.split(' ').filter(Boolean) : [];
      const res = await api.launchWithBoost(preset.path, argsArray);

      if (res.success) {
        showToast({
          type: 'success',
          title: `Launched ${preset.name}!`,
          message: 'Process started with High Priority scheduling & purified memory.'
        });
        setTimeout(fetchProcesses, 2500);
      } else {
        showToast({ type: 'error', title: 'Launch Failed', message: res.error });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Launch Error', message: err.message });
    } finally {
      setLaunchingId(null);
    }
  };

  // Convert running process directly into a preset
  const handleAddProcessAsPreset = (proc) => {
    const existing = presets.find(p => p.name.toLowerCase() === proc.name.toLowerCase());
    if (existing) {
      showToast({ type: 'info', title: 'Already Exists', message: `Profile for "${proc.name}" already in presets.` });
      return;
    }

    const newPreset = {
      id: Date.now(),
      name: proc.name,
      path: proc.path || `${proc.name}.exe`,
      args: '',
      purgeRam: true,
      highPriority: true,
      trimBackground: true,
      ultimatePower: true,
      createdAt: new Date().toLocaleDateString()
    };

    setPresets(prev => [newPreset, ...prev]);
    showToast({
      type: 'success',
      title: 'Added to Presets',
      message: `"${proc.name}" saved as an accelerator profile.`
    });
  };

  const handleBoostProcess = async (pid, name) => {
    setActionPid(pid);
    try {
      const res = await api.boostProcess(pid);
      if (res.success) {
        showToast({
          type: 'success',
          title: `Boosted ${name}!`,
          message: `Priority elevated to HIGH. Trimmed ${res.backgroundTrimmed || 0} background processes.`
        });
        fetchProcesses();
      } else {
        showToast({ type: 'error', title: 'Boost Failed', message: res.error });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Boost Error', message: err.message });
    } finally {
      setActionPid(null);
    }
  };

  const handleKillProcess = async (pid, name) => {
    if (!confirm(`Are you sure you want to terminate ${name} (PID: ${pid})?`)) return;

    setActionPid(pid);
    try {
      const res = await api.killProcess(pid);
      if (res.success) {
        showToast({
          type: 'info',
          title: 'Process Terminated',
          message: `Terminated ${name} (PID: ${pid}).`
        });
        setProcesses(prev => prev.filter(p => p.pid !== pid));
      } else {
        showToast({ type: 'error', title: 'Kill Failed', message: res.error });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Kill Error', message: err.message });
    } finally {
      setActionPid(null);
    }
  };

  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(presets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "alt_optimizer_presets.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast({ type: 'success', title: 'Config Exported', message: 'Presets saved to JSON file.' });
  };

  // Filter processes for table
  const filteredProcesses = processes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.pid.toString().includes(searchQuery);
    if (!matchesSearch) return false;

    if (activeFilter === 'games') return p.isGame;
    if (activeFilter === 'heavy') return p.ramMB > 200;
    return true;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-h-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              EXE Runner & Game Accelerator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Configure custom application profiles with real executable paths, dedicate high priority processor scheduling, and isolate from background tasks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl cyber-btn-primary text-xs font-bold select-none cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Preset</span>
          </button>

          {presets.length > 0 && (
            <button
              onClick={handleExportConfig}
              title="Export saved presets to JSON"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl cyber-btn-secondary text-xs font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Config</span>
            </button>
          )}

          <button
            onClick={fetchProcesses}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl cyber-btn-secondary text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Radar</span>
          </button>
        </div>
      </div>

      {/* Add Custom Preset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel p-6 space-y-4 border-sky-500/40 shadow-2xl animate-scale-up bg-[#0e131f]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  New Application Preset
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Preset Display Name
                </label>
                <input
                  type="text"
                  required
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g. Valorant, GTA V, Blender, OBS"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Executable Path (.exe)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={presetPath}
                    onChange={(e) => setPresetPath(e.target.value)}
                    placeholder="C:\Games\GameName\Game.exe"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={handleBrowseExe}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Launch Arguments (Optional)
                </label>
                <input
                  type="text"
                  value={presetArgs}
                  onChange={(e) => setPresetArgs(e.target.value)}
                  placeholder="-high -fullscreen"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Pre-launch options */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Automatic Pre-Launch Sequence:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={presetPurgeRam}
                      onChange={(e) => setPresetPurgeRam(e.target.checked)}
                      className="accent-sky-400"
                    />
                    <span>Purge Standby RAM</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={presetHighPriority}
                      onChange={(e) => setPresetHighPriority(e.target.checked)}
                      className="accent-sky-400"
                    />
                    <span>Set High Priority</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={presetTrimBackground}
                      onChange={(e) => setPresetTrimBackground(e.target.checked)}
                      className="accent-sky-400"
                    />
                    <span>Trim Background Apps</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={presetUltimatePower}
                      onChange={(e) => setPresetUltimatePower(e.target.checked)}
                      className="accent-sky-400"
                    />
                    <span>Ultimate Power Plan</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg cyber-btn-primary font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Saved Presets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Saved Accelerators & Game Profiles ({presets.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Config saved in local storage
          </span>
        </div>

        {presets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {presets.map((p) => {
              const isLaunching = launchingId === p.id;

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl glass-panel glass-panel-hover flex flex-col justify-between space-y-3 relative group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
                          <Gamepad2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Added {p.createdAt || 'Saved'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeletePreset(p.id, p.name)}
                        title="Delete Preset"
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 font-mono text-[10px] text-slate-400 truncate" title={p.path}>
                      {p.path}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Boost Ready</span>
                    </div>

                    <button
                      onClick={() => handleLaunchPreset(p)}
                      disabled={isLaunching}
                      className="px-3.5 py-1.5 rounded-lg cyber-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Play className={`w-3 h-3 fill-slate-950 ${isLaunching ? 'animate-spin' : ''}`} />
                      <span>{isLaunching ? 'Launching...' : 'Run & Boost'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl glass-panel text-center space-y-2 border-dashed border-slate-700">
            <Gamepad2 className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">
              No Application Profiles Configured Yet
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click <strong>"Add Custom Preset"</strong> above to browse any `.exe` on your PC, or click <strong>"+ Preset"</strong> next to any running application in the radar below.
            </p>
          </div>
        )}
      </div>

      {/* Active Process Radar Table */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Active System Processes ({filteredProcesses.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Live hardware footprints from Windows process subsystem
            </span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeFilter === 'all' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('games')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeFilter === 'games' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Games
              </button>
              <button
                onClick={() => setActiveFilter('heavy')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeFilter === 'heavy' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Heavy (&gt;200MB)
              </button>
            </div>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PID or name..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Process Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                <th className="pb-2.5 pl-2">PID</th>
                <th className="pb-2.5">Process Name</th>
                <th className="pb-2.5">RAM Footprint</th>
                <th className="pb-2.5">Priority</th>
                <th className="pb-2.5">Threads</th>
                <th className="pb-2.5 text-right pr-2">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredProcesses.map((proc) => {
                const isActionActive = actionPid === proc.pid;
                const isHigh = proc.priority === 'High' || proc.priority === 'RealTime';

                return (
                  <tr key={proc.pid} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 pl-2 text-slate-500">{proc.pid}</td>
                    <td className="py-2.5 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{proc.name}</span>
                        {proc.isGame && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 uppercase font-sans">
                            Game
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className={`font-bold ${proc.ramMB > 500 ? 'text-amber-400' : 'text-sky-400'}`}>
                        {proc.ramMB.toFixed(1)} MB
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        isHigh 
                          ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        {proc.priority}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">{proc.threads}</td>
                    <td className="py-2.5 text-right pr-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleAddProcessAsPreset(proc)}
                          title="Save this running application as a custom launch preset"
                          className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-sans flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-sky-400" />
                          <span>Preset</span>
                        </button>
                        <button
                          onClick={() => handleBoostProcess(proc.pid, proc.name)}
                          disabled={isActionActive}
                          title="Boost to High Priority and trim background apps"
                          className="px-2.5 py-1 rounded bg-sky-950/80 hover:bg-sky-900/90 text-sky-300 border border-sky-500/40 text-[11px] font-sans font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className={`w-3 h-3 text-sky-400 ${isActionActive ? 'animate-spin' : ''}`} />
                          <span>Boost</span>
                        </button>
                        <button
                          onClick={() => handleKillProcess(proc.pid, proc.name)}
                          disabled={isActionActive}
                          title="Terminate process"
                          className="p-1 rounded bg-slate-900 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 transition-colors cursor-pointer"
                        >
                          <XOctagon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProcesses.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 font-mono">
                    No active processes matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
