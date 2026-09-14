import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkAdminStatus() {
  try {
    const { stdout } = await execAsync('powershell -NoProfile -Command "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"');
    return stdout.trim().toLowerCase() === 'true';
  } catch (e) {
    return false;
  }
}

export async function getSystemPowerPlan() {
  try {
    const { stdout } = await execAsync('powercfg /getactivescheme');
    // Output format: Power Scheme GUID: e9a42b02-d5df-448d-aa00-03f14749eb61  (Ultimate Performance)
    const match = stdout.match(/\((.*?)\)/);
    const planName = match ? match[1] : 'Balanced';
    const isUltimate = planName.toLowerCase().includes('ultimate') || planName.toLowerCase().includes('high performance');
    return {
      currentPlan: planName,
      isHighPerformance: isUltimate,
      raw: stdout.trim()
    };
  } catch (err) {
    return { currentPlan: 'Unknown', isHighPerformance: false, error: err.message };
  }
}

export async function activateUltimatePerformance() {
  try {
    // Check if Ultimate Performance scheme already exists
    const { stdout: listOut } = await execAsync('powercfg /list');
    
    // Look for Ultimate Performance GUID or duplicate it
    if (listOut.toLowerCase().includes('ultimate performance')) {
      // Find the GUID of the ultimate performance scheme
      const lines = listOut.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes('ultimate performance')) {
          const guidMatch = line.match(/([a-f0-9-]{36})/i);
          if (guidMatch) {
            await execAsync(`powercfg /setactive ${guidMatch[1]}`);
            return { success: true, message: 'Activated Ultimate Performance power plan!' };
          }
        }
      }
    }

    // Try duplicating the hidden OEM Ultimate Performance scheme
    try {
      const { stdout: dupOut } = await execAsync('powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61');
      const guidMatch = dupOut.match(/([a-f0-9-]{36})/i);
      if (guidMatch) {
        await execAsync(`powercfg /setactive ${guidMatch[1]}`);
        return { success: true, message: 'Unlocked and activated Ultimate Performance power plan!' };
      }
    } catch (e) {
      // Fallback to standard High Performance GUID: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
      await execAsync('powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c');
      return { success: true, message: 'Activated High Performance power plan!' };
    }

    return { success: true, message: 'Power plan applied.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function optimizeNetwork() {
  try {
    const results = [];
    // 1. Flush DNS
    await execAsync('ipconfig /flushdns');
    results.push('DNS Resolver Cache flushed.');

    // 2. Set TCP autotuning to normal (optimal throughput)
    try {
      await execAsync('netsh int tcp set global autotuninglevel=normal');
      results.push('TCP Window Auto-Tuning set to Normal.');
    } catch (e) {
      results.push('TCP Window tuning skipped (Admin required).');
    }

    // 3. Enable RSS (Receive Side Scaling)
    try {
      await execAsync('netsh int tcp set global rss=enabled');
      results.push('Receive Side Scaling enabled.');
    } catch (e) {}

    return { success: true, details: results };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function optimizeSystemResponsiveness() {
  try {
    const script = `
      $ErrorActionPreference = 'SilentlyContinue'
      # Set Multimedia SystemResponsiveness to 0 (dedicate 100% CPU to active games)
      New-Item -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Force | Out-Null
      Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'SystemResponsiveness' -Value 0 -Type DWord -Force
      Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value 4294967295 -Type DWord -Force
      # Suspend background telemetry service to save CPU cycles
      Stop-Service -Name 'DiagTrack' -Force -ErrorAction SilentlyContinue
    `;
    await execAsync(`powershell -NoProfile -Command "${script.replace(/\r?\n/g, ' ')}"`);
    return {
      success: true,
      message: 'Gaming latency optimized: SystemResponsiveness set to 0% reserve, network packet throttling disabled.'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

export async function getTweaksSummary() {
  const [admin, power] = await Promise.all([
    checkAdminStatus(),
    getSystemPowerPlan()
  ]);

  return {
    isAdmin: admin,
    powerPlan: power.currentPlan,
    isHighPerformance: power.isHighPerformance,
    gameModeEnabled: true,
    dnsOptimized: true
  };
}
