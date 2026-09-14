import { exec, execFile, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { optimizeRam } from './ram.js';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// Known game launchers and popular processes
export const KNOWN_GAMES_PATTERNS = [
  /steam/i, /riot/i, /epicgames/i, /valorant/i, /league/i, /cs2/i, /csgo/i,
  /gta/i, /fortnite/i, /apex/i, /overwatch/i, /minecraft/i, /roblox/i,
  /cyberpunk/i, /rdr2/i, /genshin/i, /dota2/i, /cod/i, /warzone/i,
  /destiny2/i, /rocketleague/i, /pubg/i, /fifa/i, /fc24/i, /fc25/i,
  /forza/i, /starfield/i, /witcher/i, /eldenring/i, /bg3/i, /baldursgate/i
];

const BIN_PATH = path.resolve(process.cwd(), 'bin', 'MemoryEngine.exe');

export async function getProcessList() {
  try {
    const { stdout } = await execFileAsync(BIN_PATH, ['--processes'], { maxBuffer: 10 * 1024 * 1024 });
    if (!stdout.trim()) return [];

    const raw = JSON.parse(stdout.trim());
    const list = Array.isArray(raw) ? raw : [raw];

    return list.slice(0, 80).map(p => {
      const isGame = KNOWN_GAMES_PATTERNS.some(rx => rx.test(p.name));
      return {
        ...p,
        isGame
      };
    });
  } catch (err) {
    console.error('Error fetching process list:', err);
    return [];
  }
}

export async function setProcessPriority(pid, priority = 'High') {
  try {
    const allowed = ['Normal', 'AboveNormal', 'High', 'RealTime', 'BelowNormal', 'Idle'];
    if (!allowed.includes(priority)) priority = 'High';

    const cmd = `powershell -NoProfile -Command "(Get-Process -Id ${pid}).PriorityClass = [System.Diagnostics.ProcessPriorityClass]::${priority}"`;
    await execAsync(cmd);
    return { success: true, pid, priority };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function boostProcess(pid) {
  try {
    // 1. Elevate priority to High
    await setProcessPriority(pid, 'High');

    // 2. Trim working sets of all other competing background processes
    const ramResult = await optimizeRam('--empty-workingsets');

    return {
      success: true,
      pid,
      priority: 'High',
      backgroundTrimmed: ramResult.workingSetsTrimmed || 0,
      freedBytes: ramResult.freedBytes || 0,
      message: `Process PID ${pid} boosted to High Priority! Trimmed background processes.`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function killProcess(pid) {
  try {
    await execAsync(`taskkill /F /PID ${pid}`);
    return { success: true, pid };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Active boosted sessions tracked in memory
const activeGameSessions = new Map();

export async function launchWithBoost(exePath, args = []) {
  try {
    if (!fs.existsSync(exePath)) {
      return { success: false, error: 'Executable file not found at path' };
    }

    // Step 1: Pre-launch system boost
    // Purge Standby memory and empty background working sets
    await optimizeRam('--all');

    // Step 2: Launch the executable with High priority
    const dir = path.dirname(exePath);
    const fileName = path.basename(exePath);

    const child = spawn(exePath, args, {
      cwd: dir,
      detached: true,
      stdio: 'ignore'
    });

    child.unref();

    // Give it a moment to spawn and apply priority
    setTimeout(async () => {
      try {
        if (child.pid) {
          await setProcessPriority(child.pid, 'High');
        }
      } catch (e) {}
    }, 1500);

    const session = {
      id: Date.now(),
      pid: child.pid,
      exePath,
      name: fileName,
      startTime: new Date().toISOString()
    };

    activeGameSessions.set(session.id, session);

    return {
      success: true,
      session,
      message: `Launched ${fileName} with High Priority & RAM Purge.`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function getActiveBoostSessions() {
  return Array.from(activeGameSessions.values());
}
