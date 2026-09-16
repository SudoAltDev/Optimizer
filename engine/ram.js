import path from 'path';
import fs from 'fs';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BIN_PATH = fs.existsSync(path.resolve(__dirname, '..', 'bin', 'MemoryEngine.exe'))
  ? path.resolve(__dirname, '..', 'bin', 'MemoryEngine.exe')
  : path.resolve(process.cwd(), 'bin', 'MemoryEngine.exe');

export async function getRamStats() {
  try {
    const { stdout } = await execFileAsync(BIN_PATH, ['--status']);
    const data = JSON.parse(stdout.trim());

    // Also get Standby/Cached memory from Windows Performance Counter
    let standbyBytes = 0;
    try {
      // Memory Standby Cache Bytes can be approximated via Available - FreePhysicalMemory
      // Or query WMI for CacheBytes
      const totalGB = (data.totalPhysBytes / (1024 ** 3)).toFixed(1);
      const usedGB = (data.usedPhysBytes / (1024 ** 3)).toFixed(1);
      const availGB = (data.availPhysBytes / (1024 ** 3)).toFixed(1);

      return {
        totalBytes: data.totalPhysBytes,
        usedBytes: data.usedPhysBytes,
        availBytes: data.availPhysBytes,
        percent: data.memoryLoadPercent,
        totalGB,
        usedGB,
        availGB,
        pageFileTotalBytes: data.totalPageFileBytes,
        pageFileAvailBytes: data.availPageFileBytes,
        success: true
      };
    } catch (e) {
      return {
        ...data,
        percent: data.memoryLoadPercent,
        success: true
      };
    }
  } catch (err) {
    // Fallback to os module
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return {
      totalBytes: total,
      availBytes: free,
      usedBytes: used,
      percent: Math.round((used / total) * 100),
      totalGB: (total / (1024 ** 3)).toFixed(1),
      usedGB: (used / (1024 ** 3)).toFixed(1),
      availGB: (free / (1024 ** 3)).toFixed(1),
      success: true
    };
  }
}

export async function optimizeRam(mode = '--all') {
  try {
    const { stdout } = await execFileAsync(BIN_PATH, [mode]);
    const data = JSON.parse(stdout.trim());
    return data;
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

export async function trimProcessMemory(pid) {
  try {
    const script = `
      $proc = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
      if ($proc) {
        $before = $proc.WorkingSet64
        [System.GC]::Collect()
        $ws = [IntPtr]::Zero
        $type = Add-Type -MemberDefinition '[DllImport("psapi.dll")] public static extern int EmptyWorkingSet(IntPtr hwProc);' -Name 'Mem' -Namespace 'Win32' -PassThru -ErrorAction SilentlyContinue
        if ($type) {
          [Win32.Mem]::EmptyWorkingSet($proc.Handle) | Out-Null
        }
        $proc.Refresh()
        $after = $proc.WorkingSet64
        $freed = [Math]::Max(0, $before - $after)
        @{ success = $true; freedBytes = $freed; pid = ${pid} } | ConvertTo-Json
      } else {
        @{ success = $false; error = "Process not found" } | ConvertTo-Json
      }
    `;
    const { stdout } = await execAsync(`powershell -NoProfile -Command "${script.replace(/\r?\n/g, ' ')}"`);
    return JSON.parse(stdout.trim());
  } catch (err) {
    return { success: false, error: err.message };
  }
}
