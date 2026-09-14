const BASE_URL = window.location.port === '5173' ? 'http://127.0.0.1:4577' : '';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // System Status & Score
  getStatus: () => fetchJson('/api/status'),

  // Cleaner
  scanCleaner: () => fetchJson('/api/cleaner/scan'),
  cleanCleaner: (categoryIds = null) => fetchJson('/api/cleaner/clean', {
    method: 'POST',
    body: JSON.stringify({ categoryIds }),
  }),

  // RAM
  getRamStats: () => fetchJson('/api/ram/stats'),
  optimizeRam: (mode = '--all') => fetchJson('/api/ram/optimize', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  }),

  // Processes & Game Booster
  getProcesses: () => fetchJson('/api/processes'),
  boostProcess: (pid) => fetchJson('/api/processes/boost', {
    method: 'POST',
    body: JSON.stringify({ pid }),
  }),
  killProcess: (pid) => fetchJson('/api/processes/kill', {
    method: 'POST',
    body: JSON.stringify({ pid }),
  }),
  launchWithBoost: (exePath, args = []) => fetchJson('/api/processes/launch', {
    method: 'POST',
    body: JSON.stringify({ exePath, args }),
  }),
  getBoostSessions: () => fetchJson('/api/processes/sessions'),

  // Tweaks
  getTweaks: () => fetchJson('/api/tweaks'),
  activatePowerPlan: () => fetchJson('/api/tweaks/power', { method: 'POST' }),
  optimizeNetwork: () => fetchJson('/api/tweaks/network', { method: 'POST' }),
  optimizeLatency: () => fetchJson('/api/tweaks/latency', { method: 'POST' }),

  // 1-Click Master Boost
  masterBoost: () => fetchJson('/api/master-boost', { method: 'POST' }),

  // Live WebSocket Telemetry
  connectTelemetry: (onData) => {
    const wsUrl = window.location.port === '5173'
      ? 'ws://127.0.0.1:4577/ws'
      : `ws://${window.location.host}/ws`;

    let ws = null;
    let reconnectTimeout = null;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'telemetry') {
              onData(data);
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }
};
