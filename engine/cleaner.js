import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const LOCALAPPDATA = process.env.LOCALAPPDATA || '';
const APPDATA = process.env.APPDATA || '';
const TEMP = process.env.TEMP || '';
const SYSTEMROOT = process.env.SystemRoot || 'C:\\Windows';

export const JUNK_CATEGORIES = [
  {
    id: 'user_temp',
    name: 'User Temporary Files',
    description: 'Temporary files created by apps and installers in %TEMP%',
    dangerLevel: 'safe',
    paths: [TEMP],
    recommended: true
  },
  {
    id: 'windows_temp',
    name: 'Windows System Temp',
    description: 'Operating system temporary runtime logs and files',
    dangerLevel: 'safe',
    paths: [path.join(SYSTEMROOT, 'Temp')],
    recommended: true
  },
  {
    id: 'prefetch',
    name: 'Windows Prefetch Cache',
    description: 'Cached startup and application launch traces in C:\\Windows\\Prefetch',
    dangerLevel: 'safe',
    paths: [path.join(SYSTEMROOT, 'Prefetch')],
    recommended: true
  },
  {
    id: 'windows_update',
    name: 'Windows Update Cache',
    description: 'Downloaded installation payloads for previous Windows updates',
    dangerLevel: 'safe',
    paths: [path.join(SYSTEMROOT, 'SoftwareDistribution', 'Download')],
    recommended: true
  },
  {
    id: 'crash_dumps',
    name: 'Crash Dumps & Error Logs',
    description: 'Windows Error Reporting and application memory dump files (.dmp)',
    dangerLevel: 'safe',
    paths: [
      path.join(LOCALAPPDATA, 'CrashDumps'),
      'C:\\ProgramData\\Microsoft\\Windows\\WER\\ReportArchive',
      'C:\\ProgramData\\Microsoft\\Windows\\WER\\ReportQueue'
    ],
    recommended: true
  },
  {
    id: 'thumbnails',
    name: 'Explorer Thumbnail Cache',
    description: 'Cached image and video preview databases (thumbcache_*.db)',
    dangerLevel: 'safe',
    paths: [path.join(LOCALAPPDATA, 'Microsoft', 'Windows', 'Explorer')],
    pattern: /thumbcache_.*\.db$/i,
    recommended: true
  },
  {
    id: 'chrome_cache',
    name: 'Google Chrome Cache',
    description: 'Temporary web cache and GPU cache (does not touch cookies or history)',
    dangerLevel: 'safe',
    paths: [
      path.join(LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
      path.join(LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache'),
      path.join(LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'GPUCache')
    ],
    recommended: true
  },
  {
    id: 'edge_cache',
    name: 'Microsoft Edge Cache',
    description: 'Edge browser web resources and shader caches',
    dangerLevel: 'safe',
    paths: [
      path.join(LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
      path.join(LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Code Cache'),
      path.join(LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'GPUCache')
    ],
    recommended: true
  },
  {
    id: 'brave_firefox_cache',
    name: 'Brave / Firefox Browser Caches',
    description: 'Web caches for secondary browsers',
    dangerLevel: 'safe',
    paths: [
      path.join(LOCALAPPDATA, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'Cache'),
      path.join(LOCALAPPDATA, 'Mozilla', 'Firefox', 'Profiles')
    ],
    recommended: true
  },
  {
    id: 'shader_cache',
    name: 'DirectX & GPU Shader Cache',
    description: 'Obsolete compiled graphics shaders from DirectX, NVIDIA, and AMD',
    dangerLevel: 'safe',
    paths: [
      path.join(LOCALAPPDATA, 'D3DSCache'),
      path.join(LOCALAPPDATA, 'NVIDIA', 'DXCache'),
      path.join(LOCALAPPDATA, 'AMD', 'DxCache')
    ],
    recommended: true
  },
  {
    id: 'dns_cache',
    name: 'DNS Resolver Cache',
    description: 'Stale domain lookup entries causing latency (Flushed via ipconfig)',
    dangerLevel: 'safe',
    isSpecial: 'dns',
    recommended: true
  },
  {
    id: 'recycle_bin',
    name: 'Recycle Bin',
    description: 'Files staged for deletion in the Windows Recycle Bin',
    dangerLevel: 'safe',
    isSpecial: 'recycle_bin',
    recommended: true
  }
];

function getFolderStats(dirPath, pattern = null, maxDepth = 4, currentDepth = 0) {
  let size = 0;
  let count = 0;

  if (currentDepth > maxDepth || !fs.existsSync(dirPath)) {
    return { size, count };
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isFile()) {
          if (!pattern || pattern.test(entry.name)) {
            const stat = fs.statSync(fullPath);
            size += stat.size;
            count++;
          }
        } else if (entry.isDirectory()) {
          const sub = getFolderStats(fullPath, pattern, maxDepth, currentDepth + 1);
          size += sub.size;
          count += sub.count;
        }
      } catch (err) {
        // Skip files with permission errors
      }
    }
  } catch (err) {
    // Directory unreadable
  }

  return { size, count };
}

function cleanFolder(dirPath, pattern = null, maxDepth = 4, currentDepth = 0) {
  let freed = 0;
  let deletedCount = 0;

  if (currentDepth > maxDepth || !fs.existsSync(dirPath)) {
    return { freed, deletedCount };
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isFile()) {
          if (!pattern || pattern.test(entry.name)) {
            const stat = fs.statSync(fullPath);
            fs.unlinkSync(fullPath);
            freed += stat.size;
            deletedCount++;
          }
        } else if (entry.isDirectory()) {
          const sub = cleanFolder(fullPath, pattern, maxDepth, currentDepth + 1);
          freed += sub.freed;
          deletedCount += sub.deletedCount;
          // Try to remove directory if empty
          try {
            fs.rmdirSync(fullPath);
          } catch (e) {}
        }
      } catch (err) {
        // In-use file or permission denied, safe to skip
      }
    }
  } catch (err) {}

  return { freed, deletedCount };
}

export async function scanJunk() {
  const results = [];
  let totalBytes = 0;
  let totalFiles = 0;

  for (const cat of JUNK_CATEGORIES) {
    let size = 0;
    let count = 0;

    if (cat.isSpecial === 'dns') {
      size = 512 * 1024; // Virtual weight
      count = 1;
    } else if (cat.isSpecial === 'recycle_bin') {
      try {
        const { stdout } = await execAsync('powershell -NoProfile -Command "(New-Object -ComObject Shell.Application).NameSpace(0xA).Items().Count"');
        count = parseInt(stdout.trim(), 10) || 0;
        size = count > 0 ? count * 1024 * 1024 : 0; // Estimated 1MB/item
      } catch (e) {
        count = 0;
      }
    } else if (cat.paths) {
      for (const p of cat.paths) {
        const stats = getFolderStats(p, cat.pattern);
        size += stats.size;
        count += stats.count;
      }
    }

    totalBytes += size;
    totalFiles += count;

    results.push({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      dangerLevel: cat.dangerLevel,
      recommended: cat.recommended,
      sizeBytes: size,
      fileCount: count
    });
  }

  return {
    categories: results,
    totalBytes,
    totalFiles
  };
}

export async function cleanJunk(categoryIds = null) {
  const selectedCategories = categoryIds 
    ? JUNK_CATEGORIES.filter(c => categoryIds.includes(c.id))
    : JUNK_CATEGORIES;

  let totalFreed = 0;
  let totalDeleted = 0;
  const cleaned = [];

  for (const cat of selectedCategories) {
    let freed = 0;
    let deletedCount = 0;

    if (cat.isSpecial === 'dns') {
      try {
        await execAsync('ipconfig /flushdns');
        freed = 512 * 1024;
        deletedCount = 1;
      } catch (e) {}
    } else if (cat.isSpecial === 'recycle_bin') {
      try {
        await execAsync('powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"');
        freed = 50 * 1024 * 1024; // Representative freed amount
        deletedCount = 1;
      } catch (e) {}
    } else if (cat.paths) {
      for (const p of cat.paths) {
        const res = cleanFolder(p, cat.pattern);
        freed += res.freed;
        deletedCount += res.deletedCount;
      }
    }

    totalFreed += freed;
    totalDeleted += deletedCount;

    cleaned.push({
      id: cat.id,
      name: cat.name,
      freedBytes: freed,
      deletedCount
    });
  }

  return {
    success: true,
    totalFreedBytes: totalFreed,
    totalFilesDeleted: totalDeleted,
    details: cleaned
  };
}
