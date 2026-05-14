import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { useTerminalSize } from './hooks.js';
import { spawn, execSync } from 'node:child_process';
import { networkInterfaces, homedir } from 'node:os';
import { mkdirSync, openSync, closeSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadConfig, saveConfig, addToZshrc, removeFromZshrc } from './store.js';
import { enableLaunchAgent, disableLaunchAgent } from './launchAgent.js';
import { loadPids, savePids, isPidRunning } from './pids.js';
import FormView from './FormView.jsx';
import WelcomeView from './WelcomeView.jsx';

function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const iface of nets[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

const PORT_RE = [
  /https?:\/\/(?:localhost|0\.0\.0\.0|127\.0\.0\.1):(\d{2,5})/i,
  /(?:port|listening|running on|available at|started on)\s*:?\s*(\d{3,5})/i,
  /:(\d{4,5})\b/,
];

function detectPort(text) {
  for (const re of PORT_RE) {
    const m = text.match(re);
    if (m) {
      const p = parseInt(m[1], 10);
      if (p >= 1024 && p <= 65535) return p;
    }
  }
  return null;
}

function logPath(id) {
  return join(homedir(), '.config', 'localrun', 'logs', `${id}.log`);
}

export default function App() {
  const { exit } = useApp();
  const { cols } = useTerminalSize();
  const [config, setConfig] = useState(() => loadConfig());
  const [sel, setSel] = useState(0);
  const [screen, setScreen] = useState(() => loadConfig().welcomeSeen ? 'list' : 'welcome');
  const [editTarget, setEditTarget] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // running[id] = { port, pid } — used for rendering
  const [running, setRunning] = useState(() => {
    const pids = loadPids();
    const alive = {};
    const dead = [];
    for (const [id, info] of Object.entries(pids)) {
      if (isPidRunning(info.pid)) alive[id] = { port: info.port ?? null, pid: info.pid };
      else dead.push(id);
    }
    if (dead.length) {
      const updated = { ...pids };
      dead.forEach(id => delete updated[id]);
      savePids(updated);
    }
    return alive;
  });

  // procs[id] = { pid, poller } — process management, not rendered
  const procs = useRef(new Map());
  const localIP = useRef(getLocalIP());
  const scriptPath = process.argv[1];
  const servers = config.servers;

  // Restore proc handles for servers already running when app opens
  useEffect(() => {
    const pids = loadPids();
    for (const [id, info] of Object.entries(pids)) {
      if (isPidRunning(info.pid) && !procs.current.has(id)) {
        procs.current.set(id, { pid: info.pid, poller: null });
      }
    }
  }, []);

  useEffect(() => { saveConfig(config); }, [config]);

  // No cleanup on unmount — servers keep running after TUI closes

  const startServer = useCallback((id) => {
    if (procs.current.has(id)) return;
    const server = servers.find(s => s.id === id);
    if (!server) return;

    const logDir = join(homedir(), '.config', 'localrun', 'logs');
    mkdirSync(logDir, { recursive: true });
    const path = logPath(id);
    writeFileSync(path, ''); // reset log on start

    const logFd = openSync(path, 'w');
    const proc = spawn(server.command, {
      shell: true,
      env: { ...process.env },
      detached: true,
      stdio: ['ignore', logFd, logFd],
    });
    closeSync(logFd);
    proc.unref(); // let parent process exit freely

    const { pid } = proc;
    const pids = loadPids();
    pids[id] = { pid, port: null };
    savePids(pids);
    setRunning(r => ({ ...r, [id]: { port: null, pid } }));

    const poller = setInterval(() => {
      if (!isPidRunning(pid)) {
        clearInterval(poller);
        procs.current.delete(id);
        const p = loadPids();
        delete p[id];
        savePids(p);
        setRunning(r => { const n = { ...r }; delete n[id]; return n; });
        return;
      }
      try {
        const text = readFileSync(path, 'utf8');
        const port = detectPort(text);
        if (port) {
          clearInterval(poller);
          procs.current.get(id).poller = null;
          const p = loadPids();
          if (p[id]) { p[id].port = port; savePids(p); }
          setRunning(r => r[id] ? { ...r, [id]: { ...r[id], port } } : r);
        }
      } catch {}
    }, 500);

    procs.current.set(id, { pid, poller });
  }, [servers]);

  const stopServer = useCallback((id) => {
    const entry = procs.current.get(id);
    if (!entry) return;
    const { pid, poller } = entry;

    if (poller) clearInterval(poller);
    procs.current.delete(id);
    const p = loadPids();
    delete p[id];
    savePids(p);
    setRunning(r => { const n = { ...r }; delete n[id]; return n; });

    const server = servers.find(s => s.id === id);
    if (server?.stopCommand) {
      spawn(server.stopCommand, { shell: true, env: { ...process.env } });
      setTimeout(() => { try { process.kill(-pid, 'SIGKILL'); } catch {} }, 5000);
    } else {
      try { process.kill(-pid, 'SIGTERM'); } catch {}
      setTimeout(() => { try { process.kill(-pid, 'SIGKILL'); } catch {} }, 3000);
    }
  }, [servers]);

  const toggleServer = useCallback((idx) => {
    const s = servers[idx];
    if (!s) return;
    running[s.id] ? stopServer(s.id) : startServer(s.id);
  }, [servers, running, startServer, stopServer]);

  const handleSave = useCallback((data) => {
    if (editTarget) {
      const updated = { ...editTarget, ...data };
      setConfig(c => ({ ...c, servers: c.servers.map(s => s.id === editTarget.id ? updated : s) }));
      if (data.startAtLogin !== editTarget.startAtLogin) {
        data.startAtLogin ? enableLaunchAgent(updated) : disableLaunchAgent(editTarget.id);
      }
    } else {
      const newServer = { id: randomUUID().slice(0, 8), ...data };
      setConfig(c => ({ ...c, servers: [...c.servers, newServer] }));
      if (data.startAtLogin) enableLaunchAgent(newServer);
    }
    setScreen('list');
    setEditTarget(null);
  }, [editTarget]);

  const handleDelete = useCallback(() => {
    const s = servers[sel];
    if (!s) return;
    if (running[s.id]) stopServer(s.id);
    disableLaunchAgent(s.id);
    setConfig(c => ({ ...c, servers: c.servers.filter(x => x.id !== s.id) }));
    setSel(i => Math.max(0, Math.min(i, servers.length - 2)));
    setScreen('list');
  }, [servers, sel, running, stopServer]);

  const handleWelcomeDone = useCallback(() => {
    setConfig(c => ({ ...c, welcomeSeen: true }));
    setScreen('list');
  }, []);

  const handleToggleZshrc = useCallback(() => {
    setConfig(c => {
      const next = !c.zshrcAdded;
      next ? addToZshrc(scriptPath) : removeFromZshrc();
      return { ...c, zshrcAdded: next };
    });
  }, [scriptPath]);

  useInput((input, key) => {
    if (screen === 'list') {
      if (key.upArrow) setSel(i => Math.max(0, i - 1));
      else if (key.downArrow) setSel(i => Math.min(servers.length - 1, i + 1));
      else if (key.return || input === ' ') toggleServer(sel);
      else if (input === 'a') { setEditTarget(null); setScreen('add'); }
      else if (input === 'e' && servers[sel]) { setEditTarget(servers[sel]); setScreen('edit'); }
      else if (input === 'd' && servers[sel]) setScreen('delete');
      else if (input === 'c') {
        const s = servers[sel];
        const port = s && running[s.id]?.port;
        if (port) {
          try {
            execSync(`echo -n "http://localhost:${port}" | pbcopy`);
            setCopiedId(s.id);
            setTimeout(() => setCopiedId(null), 1500);
          } catch {}
        }
      }
      else if (input === '?') setScreen('welcome');
      else if (input === 'q') exit(); // servers keep running
    } else if (screen === 'delete') {
      if (input === 'y') handleDelete();
      else if (input === 'n' || key.escape) setScreen('list');
    }
  }, { isActive: screen === 'list' || screen === 'delete' });

  if (screen === 'welcome') {
    return (
      <WelcomeView
        onDone={handleWelcomeDone}
        zshrcAdded={config.zshrcAdded}
        onToggleZshrc={handleToggleZshrc}
      />
    );
  }

  if (screen === 'add' || screen === 'edit') {
    return (
      <FormView
        mode={screen}
        initial={editTarget}
        onSave={handleSave}
        onCancel={() => { setScreen('list'); setEditTarget(null); }}
      />
    );
  }

  if (screen === 'delete') {
    const s = servers[sel];
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text bold color="red">Delete Server</Text>
        <Box marginTop={1}>
          <Text>Remove </Text>
          <Text bold color="yellow">"{s?.name}"</Text>
          <Text>? This cannot be undone.</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press </Text>
          <Text bold color="red">Y</Text>
          <Text dimColor> to confirm, </Text>
          <Text bold color="green">N</Text>
          <Text dimColor> or Esc to cancel</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">LocalRun  </Text>
        <Text dimColor>localhost server manager</Text>
      </Box>

      {servers.length === 0 ? (
        <Box marginBottom={1}>
          <Text dimColor>No servers yet — press </Text>
          <Text color="green">a</Text>
          <Text dimColor> to add one.</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginBottom={1}>
          {servers.map((server, i) => {
            const isSelected = i === sel;
            const runInfo = running[server.id];
            const alive = !!runInfo;
            const portStr = runInfo?.port ? `:${runInfo.port}` : null;

            return (
              <Box key={server.id} flexDirection="column" marginBottom={1}>
                <Box>
                  <Text color={isSelected ? 'cyan' : 'gray'} bold={isSelected}>
                    {isSelected ? '▶ ' : '  '}
                  </Text>
                  <Text bold={isSelected} color={isSelected ? 'white' : undefined}>
                    {server.name}
                  </Text>
                  <Text>{'  '}</Text>
                  {alive ? (
                    <Text color="green">
                      {'● '}{portStr ? `running ${portStr}` : 'starting…'}
                    </Text>
                  ) : (
                    <Text dimColor>○ stopped</Text>
                  )}
                  {copiedId === server.id && (
                    <>
                      <Text>{'  '}</Text>
                      <Text color="cyan" bold>✓ copied</Text>
                    </>
                  )}
                </Box>
                <Box>
                  <Text>{'   '}</Text>
                  <Text dimColor>
                    {(() => {
                      // 3 indent + 3 gap + ip:port (≈20) + safety = cols - 28, min 15
                      const maxCmd = Math.max(15, cols - 28);
                      return server.command.length > maxCmd
                        ? server.command.slice(0, maxCmd - 1) + '…'
                        : server.command;
                    })()}
                  </Text>
                  {alive && portStr && cols >= 50 && (
                    <>
                      <Text dimColor>{'   '}</Text>
                      <Text dimColor>{localIP.current}{portStr}</Text>
                    </>
                  )}
                  {server.startAtLogin && (
                    <>
                      <Text dimColor>{'  '}</Text>
                      <Text color="yellow" dimColor>↺ login</Text>
                    </>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Text dimColor>{'─'.repeat(Math.max(10, cols - 4))}</Text>
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>↑↓ navigate   Enter / Space start·stop   c copy url</Text>
        <Box marginTop={0}>
          <Text color="green">a</Text>
          <Text dimColor>dd  </Text>
          <Text color="yellow">e</Text>
          <Text dimColor>dit  </Text>
          <Text color="red">d</Text>
          <Text dimColor>elete  </Text>
          <Text dimColor>? help  q quit</Text>
        </Box>
      </Box>
    </Box>
  );
}
