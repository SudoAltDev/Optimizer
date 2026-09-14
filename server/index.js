import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import net from 'net';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { scanJunk, cleanJunk } from '../engine/cleaner.js';
import { getRamStats, optimizeRam } from '../engine/ram.js';
import { getProcessList, boostProcess, killProcess, launchWithBoost, getActiveBoostSessions } from '../engine/processManager.js';
import { checkAdminStatus, getSystemPowerPlan, activateUltimatePerformance, optimizeNetwork, optimizeSystemResponsiveness, getTweaksSummary } from '../engine/tweaks.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// Serve static frontend from dist
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// CPU usage tracking helper
let lastCpuMeasure = null;
function getCpuUsagePercent() {
  const cpus = os.cpus();
  let totalUser = 0;
  let totalNice = 0;
  let totalSys = 0;
  let totalIdle = 0;
  let totalIrq = 0;

  for (const cpu of cpus) {
    totalUser += cpu.times.user;
    totalNice += cpu.times.nice;
    totalSys += cpu.times.sys;
    totalIdle += cpu.times.idle;
    totalIrq += cpu.times.irq;
  }

  const total = totalUser + totalNice + totalSys + totalIdle + totalIrq;
  const idle = totalIdle;

  if (!lastCpuMeasure) {
    lastCpuMeasure = { total, idle };
    return 15; // Initial fallback estimate
  }

  const diffTotal = total - lastCpuMeasure.total;
  const diffIdle = idle - lastCpuMeasure.idle;
  lastCpuMeasure = { total, idle };

  if (diffTotal <= 0) return 10;
  const usage = Math.round(((diffTotal - diffIdle) / diffTotal) * 100);
  return Math.max(0, Math.min(100, usage));
}

// ----------------- REST API Endpoints -----------------

// System general status & health
app.get('/api/status', async (req, res) => {
  try {
    const [ram, admin, power] = await Promise.all([
      getRamStats(),
      checkAdminStatus(),
      getSystemPowerPlan()
    ]);

    const cpuPercent = getCpuUsagePercent();
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Generic CPU';

    // Calculate dynamic health/optimization score (0 - 100)
    // Higher RAM load or non-optimized power plan lowers score
    let score = 100;
    if (ram.percent > 75) score -= 25;
    else if (ram.percent > 55) score -= 15;
    if (!power.isHighPerformance) score -= 10;
    if (cpuPercent > 70) score -= 15;

    res.json({
      cpu: {
        percent: cpuPercent,
        model: cpuModel,
        cores: cpus.length
      },
      ram,
      admin: {
        isAdmin: admin
      },
      power,
      healthScore: Math.max(20, score),
      uptimeSeconds: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cleaner: Scan
app.get('/api/cleaner/scan', async (req, res) => {
  try {
    const data = await scanJunk();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cleaner: Clean
app.post('/api/cleaner/clean', async (req, res) => {
  try {
    const { categoryIds } = req.body || {};
    const result = await cleanJunk(categoryIds);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RAM: Stats
app.get('/api/ram/stats', async (req, res) => {
  try {
    const stats = await getRamStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RAM: Optimize / Purge Standby / Trim Working Sets
app.post('/api/ram/optimize', async (req, res) => {
  try {
    const { mode = '--all' } = req.body || {};
    const result = await optimizeRam(mode);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Processes: List
app.get('/api/processes', async (req, res) => {
  try {
    const list = await getProcessList();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Processes: Boost
app.post('/api/processes/boost', async (req, res) => {
  try {
    const { pid } = req.body;
    if (!pid) return res.status(400).json({ error: 'PID required' });
    const result = await boostProcess(pid);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Processes: Kill
app.post('/api/processes/kill', async (req, res) => {
  try {
    const { pid } = req.body;
    if (!pid) return res.status(400).json({ error: 'PID required' });
    const result = await killProcess(pid);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Processes: Launch with Boost
app.post('/api/processes/launch', async (req, res) => {
  try {
    const { exePath, args } = req.body;
    if (!exePath) return res.status(400).json({ error: 'exePath required' });
    const result = await launchWithBoost(exePath, args);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Active game boost sessions
app.get('/api/processes/sessions', (req, res) => {
  res.json(getActiveBoostSessions());
});

// Tweaks
app.get('/api/tweaks', async (req, res) => {
  try {
    const summary = await getTweaksSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tweaks/power', async (req, res) => {
  try {
    const result = await activateUltimatePerformance();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tweaks/network', async (req, res) => {
  try {
    const result = await optimizeNetwork();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tweaks/latency', async (req, res) => {
  try {
    const result = await optimizeSystemResponsiveness();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MASTER 1-CLICK SYSTEM TURBO BOOST
app.post('/api/master-boost', async (req, res) => {
  try {
    const steps = [];

    // 1. Purge Standby memory & trim working sets
    const ramResult = await optimizeRam('--all');
    steps.push({
      step: 'RAM Turbo Optimizer',
      freedBytes: ramResult.freedBytes || 0,
      details: ramResult.message
    });

    // 2. Clean safe temporary cache files (User Temp, Windows Temp, Shader Cache, DNS)
    const cleanResult = await cleanJunk(['user_temp', 'windows_temp', 'shader_cache', 'dns_cache', 'thumbnails']);
    steps.push({
      step: 'Cache & Junk Sweeper',
      freedBytes: cleanResult.totalFreedBytes || 0,
      filesDeleted: cleanResult.totalFilesDeleted || 0
    });

    // 3. Network TCP autotuning and DNS flush
    const netResult = await optimizeNetwork();
    steps.push({
      step: 'Network & DNS Latency Optimizer',
      details: netResult.details
    });

    // 4. Power Plan optimization
    const powerResult = await activateUltimatePerformance();
    steps.push({
      step: 'Power Engine',
      details: powerResult.message
    });

    const totalFreed = (ramResult.freedBytes || 0) + (cleanResult.totalFreedBytes || 0);

    res.json({
      success: true,
      totalFreedBytes: totalFreed,
      totalFreedMB: (totalFreed / (1024 * 1024)).toFixed(1),
      steps
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- WebSocket Live Telemetry -----------------
wss.on('connection', (ws) => {
  // Send immediate initial status
  sendTelemetry(ws);
});

async function sendTelemetry(targetWs = null) {
  try {
    const ram = await getRamStats();
    const cpuPercent = getCpuUsagePercent();
    const payload = JSON.stringify({
      type: 'telemetry',
      timestamp: Date.now(),
      cpu: cpuPercent,
      ram: {
        percent: ram.percent,
        usedGB: ram.usedGB,
        totalGB: ram.totalGB,
        availGB: ram.availGB,
        availBytes: ram.availBytes,
        usedBytes: ram.usedBytes
      }
    });

    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(payload);
    } else {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  } catch (e) {}
}

// Telemetry interval (every 1.5s)
setInterval(() => {
  if (wss.clients.size > 0) {
    sendTelemetry();
  }
}, 1500);

// Graceful error handlers to prevent unhandled 'error' crash
server.on('error', (err) => {
  console.warn('[AltOptimizer Server Notice]:', err.message);
});

wss.on('error', (err) => {
  console.warn('[AltOptimizer WebSocket Notice]:', err.message);
});

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, '127.0.0.1');
  });
}

function checkIsOurServer(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/status`, { timeout: 700 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function findAvailablePort(startPort = 4577, maxAttempts = 20) {
  let port = parseInt(process.env.PORT || startPort, 10);
  for (let i = 0; i < maxAttempts; i++) {
    const isFree = await checkPortAvailable(port);
    if (isFree) return { port, isExisting: false };

    // If port is occupied, check if it's already an active AltOptimizer instance
    const isAltOptimizer = await checkIsOurServer(port);
    if (isAltOptimizer) {
      return { port, isExisting: true };
    }

    console.warn(`[AltOptimizer] Port ${port} is in use by another program, trying ${port + 1}...`);
    port++;
  }
  return { port, isExisting: false };
}

async function bootstrap() {
  const { port, isExisting } = await findAvailablePort(4577);
  const runtimePath = path.resolve(process.cwd(), 'runtime.json');

  if (isExisting) {
    console.log(`[AltOptimizer Engine] An active AltOptimizer engine is already running on http://127.0.0.1:${port}`);
    try {
      fs.writeFileSync(runtimePath, JSON.stringify({ port, url: `http://127.0.0.1:${port}`, reused: true }, null, 2));
    } catch (e) {}
    return;
  }

  server.listen(port, '127.0.0.1', () => {
    console.log(`[AltOptimizer Engine] Server active at http://127.0.0.1:${port}`);
    try {
      fs.writeFileSync(runtimePath, JSON.stringify({ port, pid: process.pid, url: `http://127.0.0.1:${port}` }, null, 2));
    } catch (e) {}
  });
}

bootstrap();
