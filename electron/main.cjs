const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn, execSync } = require('child_process');

let mainWindow = null;
let serverProcess = null;
let activeServerPort = 4577;

function isElevatedAdmin() {
  if (process.platform !== 'win32') return true;
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function elevateElectronProcess() {
  if (process.platform !== 'win32') return false;
  const exe = process.execPath;
  const args = process.argv.slice(1);
  const argsString = args.map(a => `"${a}"`).join(' ');
  const workingDir = path.resolve(__dirname, '..');
  const psCmd = `Start-Process -FilePath "${exe}" -ArgumentList '${argsString}' -WorkingDirectory '${workingDir}' -Verb RunAs`;

  try {
    const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCmd], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    app.quit();
    return true;
  } catch (err) {
    console.error('Failed to trigger Administrator elevation:', err);
    return false;
  }
}

function checkUrlReachable(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 800 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function fetchJson(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 1200 }, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function killProcessOnPort(port) {
  if (process.platform !== 'win32') return;
  try {
    const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(parseInt(pid, 10)) && parseInt(pid, 10) !== process.pid) {
        console.log(`[AltOptimizer Desktop] Terminating non-admin process on port ${port} (PID: ${pid})...`);
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch (e) {}
      }
    }
  } catch (e) {}
}

function getSavedRuntimePort() {
  try {
    const runtimePath = path.join(__dirname, '..', 'runtime.json');
    if (fs.existsSync(runtimePath)) {
      const data = JSON.parse(fs.readFileSync(runtimePath, 'utf8'));
      if (data.port) return parseInt(data.port, 10);
    }
  } catch (e) {}
  return 4577;
}

async function ensureServerRunning() {
  const savedPort = getSavedRuntimePort();

  // 1. Check if server is already running on savedPort or default 4577
  const status = await fetchJson(`http://127.0.0.1:${savedPort}/api/status`);
  if (status) {
    const electronIsAdmin = isElevatedAdmin();
    const serverIsAdmin = status.admin?.isAdmin === true;

    // If Electron is running as Administrator, but the active server is NOT Administrator,
    // kill the stale non-admin server so we can spawn an elevated server instance!
    if (electronIsAdmin && !serverIsAdmin) {
      console.log(`[AltOptimizer Desktop] Server on port ${savedPort} is not elevated. Restarting with Administrator privileges...`);
      killProcessOnPort(savedPort);
      await new Promise(r => setTimeout(r, 600));
    } else {
      console.log(`[AltOptimizer Desktop] Reusing active server at http://127.0.0.1:${savedPort} (Admin: ${serverIsAdmin})`);
      activeServerPort = savedPort;
      return;
    }
  }

  // 2. Spawn node server/index.js (inherits elevated token)
  console.log('[AltOptimizer Desktop] Launching internal engine server...');
  const serverScript = path.join(__dirname, '..', 'server', 'index.js');
  serverProcess = spawn('node', [serverScript], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to spawn optimizer server:', err);
  });

  // 3. Wait until server responds (poll for up to 6 seconds)
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    const currentPort = getSavedRuntimePort();
    const ready = await checkUrlReachable(`http://127.0.0.1:${currentPort}/api/status`);
    if (ready) {
      activeServerPort = currentPort;
      console.log(`[AltOptimizer Desktop] Engine ready on http://127.0.0.1:${activeServerPort}`);
      return;
    }
  }
}

async function determineStartUrl() {
  // Check if Vite HMR dev server is actively running (e.g. npm run dev)
  const isViteRunning = await checkUrlReachable('http://127.0.0.1:5173/');
  if (isViteRunning) {
    console.log('[AltOptimizer Desktop] Connected to live Vite dev server at http://127.0.0.1:5173');
    return 'http://127.0.0.1:5173';
  }

  // Otherwise, load directly from local engine server (which serves dist/ and API)
  console.log(`[AltOptimizer Desktop] Loading interface from http://127.0.0.1:${activeServerPort}`);
  return `http://127.0.0.1:${activeServerPort}/`;
}

async function createWindow() {
  await ensureServerRunning();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 1040,
    minHeight: 660,
    frame: false,
    transparent: false,
    backgroundColor: '#07090e',
    title: 'AltOptimizer — PC & Game Turbo',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = await determineStartUrl();
  mainWindow.loadURL(startUrl).catch((err) => {
    console.warn(`Failed to load ${startUrl}, retrying in 1.5s...`);
    setTimeout(() => {
      mainWindow.loadURL(startUrl);
    }, 1500);
  });

  // Handle frameless window controls
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.on('open-external', (_, url) => {
    if (url && typeof url === 'string') {
      shell.openExternal(url);
    }
  });

  ipcMain.on('is-admin-sync', (event) => {
    event.returnValue = isElevatedAdmin();
  });

  ipcMain.handle('get-admin-status', () => {
    return isElevatedAdmin();
  });

  ipcMain.on('elevate-admin', () => {
    elevateElectronProcess();
  });

  ipcMain.handle('select-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Game or Application Executable to Boost',
      filters: [
        { name: 'Executables', extensions: ['exe', 'lnk'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
  });
}

app.whenReady().then(() => {
  // If not elevated, automatically prompt Windows UAC elevation
  const isElevated = isElevatedAdmin();
  const shouldAutoElevate = !isElevated && 
    process.platform === 'win32' && 
    !process.argv.includes('--no-elevate') && 
    process.env.ALTOPTIMIZER_NO_AUTO_ELEVATE !== '1';

  if (shouldAutoElevate) {
    console.log('[AltOptimizer Desktop] App is not elevated. Triggering Windows UAC prompt...');
    const elevated = elevateElectronProcess();
    if (elevated) return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try { serverProcess.kill(); } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
