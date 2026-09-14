import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Search, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  ShieldCheck, 
  HardDrive, 
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function CleanerView({ showToast }) {
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [totalSize, setTotalSize] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [cleanedSummary, setCleanedSummary] = useState(null);
  const [showClearBanner, setShowClearBanner] = useState(false);
  const [isDismissingBanner, setIsDismissingBanner] = useState(false);

  const dismissBanner = () => {
    if (isDismissingBanner) return;
    setIsDismissingBanner(true);
    setTimeout(() => {
      setShowClearBanner(false);
      setIsDismissingBanner(false);
    }, 280);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const runScan = async () => {
    setScanning(true);
    setCleanedSummary(null);
    setShowClearBanner(false);
    try {
      const res = await api.scanCleaner();
      setCategories(res.categories || []);
      setTotalSize(res.totalBytes || 0);
      setTotalFiles(res.totalFiles || 0);

      // Select all recommended by default
      const initialSelected = new Set(
        (res.categories || []).filter(c => c.recommended).map(c => c.id)
      );
      setSelectedIds(initialSelected);

      showToast({
        type: 'info',
        title: 'Scan Complete',
        message: `Found ${formatBytes(res.totalBytes || 0)} of cached junk across ${res.totalFiles || 0} files.`
      });
    } catch (err) {
      showToast({ type: 'error', title: 'Scan Error', message: err.message });
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  const toggleCategory = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === categories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(categories.map(c => c.id)));
    }
  };

  const handleClean = async () => {
    if (selectedIds.size === 0) {
      showToast({ type: 'error', title: 'No Categories Selected', message: 'Please select at least one cache category to clean.' });
      return;
    }

    setCleaning(true);
    try {
      const res = await api.cleanCleaner(Array.from(selectedIds));
      setCleanedSummary({
        freedBytes: res.totalFreedBytes || 0,
        filesDeleted: res.totalFilesDeleted || 0,
        details: res.details || []
      });
      setShowClearBanner(true);
      setIsDismissingBanner(false);

      showToast({
        type: 'success',
        title: 'Cache & Junk Cleared!',
        message: `Successfully reclaimed ${formatBytes(res.totalFreedBytes || 0)} and removed ${res.totalFilesDeleted || 0} junk files.`
      });

      // Re-scan after clean
      runScan();
    } catch (err) {
      showToast({ type: 'error', title: 'Clean Error', message: err.message });
    } finally {
      setCleaning(false);
    }
  };

  const selectedBytes = categories
    .filter(c => selectedIds.has(c.id))
    .reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-h-full">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Cache & System Junk Purger
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Safely remove obsolete temporary caches, prefetch traces, browser caches, and error dumps.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={runScan}
            disabled={scanning || cleaning}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl cyber-btn-secondary text-xs font-semibold select-none cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Re-Scan'}</span>
          </button>

          <button
            onClick={handleClean}
            disabled={scanning || cleaning || selectedIds.size === 0}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl cyber-btn-primary text-xs font-bold select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className={`w-3.5 h-3.5 ${cleaning ? 'animate-bounce' : ''}`} />
            <span>{cleaning ? 'Cleaning...' : 'Clean Selected'}</span>
          </button>
        </div>
      </div>

      {/* Liquid Glass Clearance Notification Banner */}
      {showClearBanner && cleanedSummary && (
        <div 
          className={`p-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-teal-950/40 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-between gap-4 transition-all select-none ${
            isDismissingBanner ? 'animate-liquid-disappear' : 'animate-liquid-appear'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-sm flex-shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Clean Sweep Successful</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Reclaimed {formatBytes(cleanedSummary.freedBytes)}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5 font-mono">
                Purged {cleanedSummary.filesDeleted.toLocaleString()} obsolete cache files across selected repositories.
              </div>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            title="Dismiss notification"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Stat Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Junk Detected
            </span>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
              {formatBytes(totalSize)}
            </div>
          </div>
          <HardDrive className="w-6 h-6 text-cyan-500/40" />
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Files to Clean
            </span>
            <div className="text-xl font-bold font-mono text-purple-400 mt-0.5">
              {totalFiles.toLocaleString()} files
            </div>
          </div>
          <FileCheck className="w-6 h-6 text-purple-500/40" />
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Selected Target Size
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {formatBytes(selectedBytes)}
            </div>
          </div>
          <button
            onClick={toggleAll}
            className="text-xs text-cyan-400 hover:underline font-mono"
          >
            {selectedIds.size === categories.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const isSelected = selectedIds.has(cat.id);
          return (
            <div
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start justify-between select-none ${
                isSelected
                  ? 'bg-gradient-to-r from-slate-900/90 to-cyan-950/30 border-cyan-500/40 shadow-glow-sm'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-cyan-400">
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 fill-cyan-950 text-cyan-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {cat.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                      100% Safe
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-sm font-bold font-mono text-cyan-300">
                  {formatBytes(cat.sizeBytes)}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {cat.fileCount} items
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
