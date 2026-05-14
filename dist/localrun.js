#!/usr/bin/env node

// bin/localrun.js
import React4 from "react";
import { render } from "ink";

// src/App.jsx
import React3, { useState as useState4, useEffect as useEffect2, useRef, useCallback } from "react";
import { Box as Box3, Text as Text3, useInput as useInput3, useApp } from "ink";

// src/hooks.js
import { useState, useEffect } from "react";
import { useStdout } from "ink";
function useTerminalSize() {
  const { stdout } = useStdout();
  const [cols, setCols] = useState(stdout?.columns ?? 80);
  const [rows, setRows] = useState(stdout?.rows ?? 24);
  useEffect(() => {
    if (!stdout) return;
    const onResize = () => {
      setCols(stdout.columns ?? 80);
      setRows(stdout.rows ?? 24);
    };
    stdout.on("resize", onResize);
    return () => stdout.off("resize", onResize);
  }, [stdout]);
  return { cols, rows };
}

// src/App.jsx
import { spawn, execSync as execSync2 } from "node:child_process";
import { networkInterfaces, homedir as homedir4 } from "node:os";
import { mkdirSync as mkdirSync3, openSync, closeSync, writeFileSync as writeFileSync4, readFileSync as readFileSync3 } from "node:fs";
import { join as join4 } from "node:path";
import { randomUUID } from "node:crypto";

// src/store.js
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
var CONFIG_DIR = join(homedir(), ".config", "localrun");
var CONFIG_FILE = join(CONFIG_DIR, "servers.json");
var ZSHRC_MARKER = "# localrun-cli";
var DEFAULT_CONFIG = { servers: [], welcomeSeen: false, zshrcAdded: false };
function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG };
  try {
    const raw = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
    if (Array.isArray(raw)) return { ...DEFAULT_CONFIG, servers: raw };
    return { ...DEFAULT_CONFIG, ...raw };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
function addToZshrc(scriptPath) {
  const zshrcPath = join(homedir(), ".zshrc");
  let content = existsSync(zshrcPath) ? readFileSync(zshrcPath, "utf8") : "";
  if (content.includes(ZSHRC_MARKER)) return;
  appendFileSync(zshrcPath, `
${ZSHRC_MARKER}
alias localrun="node ${scriptPath}"
`);
}
function removeFromZshrc() {
  const zshrcPath = join(homedir(), ".zshrc");
  if (!existsSync(zshrcPath)) return;
  const content = readFileSync(zshrcPath, "utf8");
  const cleaned = content.replace(new RegExp(`\\n?${ZSHRC_MARKER}\\nalias localrun="[^"]*"\\n?`, "g"), "");
  writeFileSync(zshrcPath, cleaned);
}

// src/launchAgent.js
import { writeFileSync as writeFileSync2, unlinkSync, existsSync as existsSync2, mkdirSync as mkdirSync2 } from "node:fs";
import { join as join2 } from "node:path";
import { homedir as homedir2, platform } from "node:os";
import { execSync } from "node:child_process";
var AGENTS_DIR = join2(homedir2(), "Library", "LaunchAgents");
var LABEL = "com.localrun";
function plistPath(id) {
  return join2(AGENTS_DIR, `${LABEL}.${id}.plist`);
}
function enableLaunchAgent(server) {
  if (platform() !== "darwin") return;
  mkdirSync2(AGENTS_DIR, { recursive: true });
  const logDir = join2(homedir2(), ".config", "localrun", "logs");
  mkdirSync2(logDir, { recursive: true });
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}.${server.id}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-c</string>
    <string>${server.command.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin"}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${join2(logDir, server.id + ".log")}</string>
  <key>StandardErrorPath</key>
  <string>${join2(logDir, server.id + ".err.log")}</string>
</dict>
</plist>`;
  const path = plistPath(server.id);
  writeFileSync2(path, plist);
  try {
    execSync(`launchctl load "${path}"`, { stdio: "ignore" });
  } catch {
  }
}
function disableLaunchAgent(id) {
  if (platform() !== "darwin") return;
  const path = plistPath(id);
  if (!existsSync2(path)) return;
  try {
    execSync(`launchctl unload "${path}"`, { stdio: "ignore" });
  } catch {
  }
  unlinkSync(path);
}

// src/pids.js
import { readFileSync as readFileSync2, writeFileSync as writeFileSync3, existsSync as existsSync3 } from "node:fs";
import { join as join3 } from "node:path";
import { homedir as homedir3 } from "node:os";
var PIDS_FILE = join3(homedir3(), ".config", "localrun", "pids.json");
function loadPids() {
  if (!existsSync3(PIDS_FILE)) return {};
  try {
    return JSON.parse(readFileSync2(PIDS_FILE, "utf8"));
  } catch {
    return {};
  }
}
function savePids(pids) {
  writeFileSync3(PIDS_FILE, JSON.stringify(pids, null, 2));
}
function isPidRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// src/FormView.jsx
import React, { useState as useState2 } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
function FormView({ mode, initial, onSave, onCancel }) {
  const { cols } = useTerminalSize();
  const [name, setName] = useState2(initial?.name ?? "");
  const [command, setCommand] = useState2(initial?.command ?? "");
  const [stopCommand, setStopCommand] = useState2(initial?.stopCommand ?? "");
  const [startAtLogin, setStartAtLogin] = useState2(initial?.startAtLogin ?? false);
  const [focus, setFocus] = useState2(0);
  const canSave = name.trim().length > 0 && command.trim().length > 0;
  const LAST = 4;
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.tab || key.downArrow) {
      setFocus((f) => Math.min(LAST, f + 1));
      return;
    }
    if (key.upArrow) {
      setFocus((f) => Math.max(0, f - 1));
      return;
    }
    if (focus >= 0 && focus <= 2 && key.return) {
      setFocus((f) => f + 1);
      return;
    }
    if (focus === 3 && (input === " " || key.return)) {
      setStartAtLogin((v) => !v);
      return;
    }
    if (focus === 4 && key.return && canSave) {
      onSave({
        name: name.trim(),
        command: command.trim(),
        stopCommand: stopCommand.trim(),
        startAtLogin
      });
    }
  });
  const labelColor = (f) => focus === f ? "cyan" : "gray";
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", paddingX: 2, paddingY: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true, color: "cyan" }, mode === "add" ? "Add Server" : "Edit Server"), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "\u2500".repeat(Math.max(10, cols - 8))), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, /* @__PURE__ */ React.createElement(Box, { marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: labelColor(0) }, "Name         "), /* @__PURE__ */ React.createElement(
    TextInput,
    {
      value: name,
      onChange: setName,
      focus: focus === 0,
      placeholder: "e.g. my-blog"
    }
  )), /* @__PURE__ */ React.createElement(Box, { marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: labelColor(1) }, "Start        "), /* @__PURE__ */ React.createElement(
    TextInput,
    {
      value: command,
      onChange: setCommand,
      focus: focus === 1,
      placeholder: "e.g. npm run dev"
    }
  )), /* @__PURE__ */ React.createElement(Box, { marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: labelColor(2) }, "Stop         "), /* @__PURE__ */ React.createElement(
    TextInput,
    {
      value: stopCommand,
      onChange: setStopCommand,
      focus: focus === 2,
      placeholder: "optional \u2014 leave blank to use SIGTERM"
    }
  )), /* @__PURE__ */ React.createElement(Box, { marginBottom: 1, alignItems: "center" }, /* @__PURE__ */ React.createElement(Text, { color: labelColor(3) }, "Start at login  "), /* @__PURE__ */ React.createElement(
    Text,
    {
      bold: focus === 3,
      inverse: focus === 3,
      color: startAtLogin ? "green" : "gray"
    },
    startAtLogin ? " Yes " : " No  "
  ), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "  space to toggle")), /* @__PURE__ */ React.createElement(Box, { marginTop: 1 }, /* @__PURE__ */ React.createElement(
    Text,
    {
      bold: true,
      inverse: focus === 4,
      color: !canSave ? "gray" : focus === 4 ? "white" : "green"
    },
    " Save "
  ), !canSave && /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "  name and start command required"))), /* @__PURE__ */ React.createElement(Box, { marginTop: 2 }, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "Tab / \u2191\u2193 navigate   Esc cancel")));
}

// src/WelcomeView.jsx
import React2, { useState as useState3 } from "react";
import { Box as Box2, Text as Text2, useInput as useInput2 } from "ink";
function WelcomeView({ onDone, zshrcAdded, onToggleZshrc }) {
  const [toggling, setToggling] = useState3(false);
  const { cols } = useTerminalSize();
  const sep = "\u2500".repeat(Math.max(10, cols - 8));
  useInput2((input, key) => {
    if (key.return || input === " ") {
      if (!toggling) {
        onDone();
        return;
      }
    }
    if (input === "z") {
      onToggleZshrc();
    }
    if (key.escape) {
      onDone();
    }
  });
  return /* @__PURE__ */ React2.createElement(Box2, { flexDirection: "column", paddingX: 2, paddingY: 1 }, /* @__PURE__ */ React2.createElement(Box2, { marginBottom: 1 }, /* @__PURE__ */ React2.createElement(Text2, { bold: true, color: "cyan" }, "LocalRun"), /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, "  localhost server manager")), /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, sep), /* @__PURE__ */ React2.createElement(Box2, { flexDirection: "column", marginTop: 1, marginBottom: 1 }, /* @__PURE__ */ React2.createElement(Text2, null, "Manage all your localhost dev servers from one place."), /* @__PURE__ */ React2.createElement(Text2, null, "No more remembering paths and commands.")), /* @__PURE__ */ React2.createElement(Box2, { flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React2.createElement(Box2, null, /* @__PURE__ */ React2.createElement(Text2, { color: "green" }, "  \u25CF "), /* @__PURE__ */ React2.createElement(Text2, null, "Add servers with their start and stop commands")), /* @__PURE__ */ React2.createElement(Box2, null, /* @__PURE__ */ React2.createElement(Text2, { color: "green" }, "  \u25CF "), /* @__PURE__ */ React2.createElement(Text2, null, "Start / stop with "), /* @__PURE__ */ React2.createElement(Text2, { bold: true }, "Enter"), /* @__PURE__ */ React2.createElement(Text2, null, " or "), /* @__PURE__ */ React2.createElement(Text2, { bold: true }, "Space")), /* @__PURE__ */ React2.createElement(Box2, null, /* @__PURE__ */ React2.createElement(Text2, { color: "green" }, "  \u25CF "), /* @__PURE__ */ React2.createElement(Text2, null, "Port and IP shown when running \u2014 easy copy-paste")), /* @__PURE__ */ React2.createElement(Box2, null, /* @__PURE__ */ React2.createElement(Text2, { color: "green" }, "  \u25CF "), /* @__PURE__ */ React2.createElement(Text2, null, "Optional: start a server automatically at macOS login"))), /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, sep), /* @__PURE__ */ React2.createElement(Box2, { marginTop: 1, marginBottom: 1, flexDirection: "column" }, /* @__PURE__ */ React2.createElement(Box2, null, /* @__PURE__ */ React2.createElement(Text2, null, "Add "), /* @__PURE__ */ React2.createElement(Text2, { bold: true, color: "cyan" }, "localrun"), /* @__PURE__ */ React2.createElement(Text2, null, " alias to ~/.zshrc   "), /* @__PURE__ */ React2.createElement(
    Text2,
    {
      bold: true,
      inverse: true,
      color: zshrcAdded ? "green" : "gray"
    },
    zshrcAdded ? " Yes " : " No  "
  ), /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, "  press "), /* @__PURE__ */ React2.createElement(Text2, { bold: true }, "z"), /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, " to toggle")), zshrcAdded && /* @__PURE__ */ React2.createElement(Box2, { marginTop: 0, paddingLeft: 2 }, /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, "Type "), /* @__PURE__ */ React2.createElement(Text2, { color: "cyan" }, "localrun"), /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, " in any new terminal to open this app."))), /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, sep), /* @__PURE__ */ React2.createElement(Box2, { marginTop: 1 }, /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, "Press "), /* @__PURE__ */ React2.createElement(Text2, { bold: true }, "Enter"), /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, " or "), /* @__PURE__ */ React2.createElement(Text2, { bold: true }, "Space"), /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, " to get started")));
}

// src/App.jsx
function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const iface of nets[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "127.0.0.1";
}
var PORT_RE = [
  /https?:\/\/(?:localhost|0\.0\.0\.0|127\.0\.0\.1):(\d{2,5})/i,
  /(?:port|listening|running on|available at|started on)\s*:?\s*(\d{3,5})/i,
  /:(\d{4,5})\b/
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
  return join4(homedir4(), ".config", "localrun", "logs", `${id}.log`);
}
function App() {
  const { exit } = useApp();
  const { cols } = useTerminalSize();
  const [config, setConfig] = useState4(() => loadConfig());
  const [sel, setSel] = useState4(0);
  const [screen, setScreen] = useState4(() => loadConfig().welcomeSeen ? "list" : "welcome");
  const [editTarget, setEditTarget] = useState4(null);
  const [copiedId, setCopiedId] = useState4(null);
  const [running, setRunning] = useState4(() => {
    const pids = loadPids();
    const alive = {};
    const dead = [];
    for (const [id, info] of Object.entries(pids)) {
      if (isPidRunning(info.pid)) alive[id] = { port: info.port ?? null, pid: info.pid };
      else dead.push(id);
    }
    if (dead.length) {
      const updated = { ...pids };
      dead.forEach((id) => delete updated[id]);
      savePids(updated);
    }
    return alive;
  });
  const procs = useRef(/* @__PURE__ */ new Map());
  const localIP = useRef(getLocalIP());
  const scriptPath = process.argv[1];
  const servers = config.servers;
  useEffect2(() => {
    const pids = loadPids();
    for (const [id, info] of Object.entries(pids)) {
      if (isPidRunning(info.pid) && !procs.current.has(id)) {
        procs.current.set(id, { pid: info.pid, poller: null });
      }
    }
  }, []);
  useEffect2(() => {
    saveConfig(config);
  }, [config]);
  const startServer = useCallback((id) => {
    if (procs.current.has(id)) return;
    const server = servers.find((s) => s.id === id);
    if (!server) return;
    const logDir = join4(homedir4(), ".config", "localrun", "logs");
    mkdirSync3(logDir, { recursive: true });
    const path = logPath(id);
    writeFileSync4(path, "");
    const logFd = openSync(path, "w");
    const proc = spawn(server.command, {
      shell: true,
      env: { ...process.env },
      detached: true,
      stdio: ["ignore", logFd, logFd]
    });
    closeSync(logFd);
    proc.unref();
    const { pid } = proc;
    const pids = loadPids();
    pids[id] = { pid, port: null };
    savePids(pids);
    setRunning((r) => ({ ...r, [id]: { port: null, pid } }));
    const poller = setInterval(() => {
      if (!isPidRunning(pid)) {
        clearInterval(poller);
        procs.current.delete(id);
        const p = loadPids();
        delete p[id];
        savePids(p);
        setRunning((r) => {
          const n = { ...r };
          delete n[id];
          return n;
        });
        return;
      }
      try {
        const text = readFileSync3(path, "utf8");
        const port = detectPort(text);
        if (port) {
          clearInterval(poller);
          procs.current.get(id).poller = null;
          const p = loadPids();
          if (p[id]) {
            p[id].port = port;
            savePids(p);
          }
          setRunning((r) => r[id] ? { ...r, [id]: { ...r[id], port } } : r);
        }
      } catch {
      }
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
    setRunning((r) => {
      const n = { ...r };
      delete n[id];
      return n;
    });
    const server = servers.find((s) => s.id === id);
    if (server?.stopCommand) {
      spawn(server.stopCommand, { shell: true, env: { ...process.env } });
      setTimeout(() => {
        try {
          process.kill(-pid, "SIGKILL");
        } catch {
        }
      }, 5e3);
    } else {
      try {
        process.kill(-pid, "SIGTERM");
      } catch {
      }
      setTimeout(() => {
        try {
          process.kill(-pid, "SIGKILL");
        } catch {
        }
      }, 3e3);
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
      setConfig((c) => ({ ...c, servers: c.servers.map((s) => s.id === editTarget.id ? updated : s) }));
      if (data.startAtLogin !== editTarget.startAtLogin) {
        data.startAtLogin ? enableLaunchAgent(updated) : disableLaunchAgent(editTarget.id);
      }
    } else {
      const newServer = { id: randomUUID().slice(0, 8), ...data };
      setConfig((c) => ({ ...c, servers: [...c.servers, newServer] }));
      if (data.startAtLogin) enableLaunchAgent(newServer);
    }
    setScreen("list");
    setEditTarget(null);
  }, [editTarget]);
  const handleDelete = useCallback(() => {
    const s = servers[sel];
    if (!s) return;
    if (running[s.id]) stopServer(s.id);
    disableLaunchAgent(s.id);
    setConfig((c) => ({ ...c, servers: c.servers.filter((x) => x.id !== s.id) }));
    setSel((i) => Math.max(0, Math.min(i, servers.length - 2)));
    setScreen("list");
  }, [servers, sel, running, stopServer]);
  const handleWelcomeDone = useCallback(() => {
    setConfig((c) => ({ ...c, welcomeSeen: true }));
    setScreen("list");
  }, []);
  const handleToggleZshrc = useCallback(() => {
    setConfig((c) => {
      const next = !c.zshrcAdded;
      next ? addToZshrc(scriptPath) : removeFromZshrc();
      return { ...c, zshrcAdded: next };
    });
  }, [scriptPath]);
  useInput3((input, key) => {
    if (screen === "list") {
      if (key.upArrow) setSel((i) => Math.max(0, i - 1));
      else if (key.downArrow) setSel((i) => Math.min(servers.length - 1, i + 1));
      else if (key.return || input === " ") toggleServer(sel);
      else if (input === "a") {
        setEditTarget(null);
        setScreen("add");
      } else if (input === "e" && servers[sel]) {
        setEditTarget(servers[sel]);
        setScreen("edit");
      } else if (input === "d" && servers[sel]) setScreen("delete");
      else if (input === "c") {
        const s = servers[sel];
        const port = s && running[s.id]?.port;
        if (port) {
          try {
            execSync2(`echo -n "http://localhost:${port}" | pbcopy`);
            setCopiedId(s.id);
            setTimeout(() => setCopiedId(null), 1500);
          } catch {
          }
        }
      } else if (input === "?") setScreen("welcome");
      else if (input === "q") exit();
    } else if (screen === "delete") {
      if (input === "y") handleDelete();
      else if (input === "n" || key.escape) setScreen("list");
    }
  }, { isActive: screen === "list" || screen === "delete" });
  if (screen === "welcome") {
    return /* @__PURE__ */ React3.createElement(
      WelcomeView,
      {
        onDone: handleWelcomeDone,
        zshrcAdded: config.zshrcAdded,
        onToggleZshrc: handleToggleZshrc
      }
    );
  }
  if (screen === "add" || screen === "edit") {
    return /* @__PURE__ */ React3.createElement(
      FormView,
      {
        mode: screen,
        initial: editTarget,
        onSave: handleSave,
        onCancel: () => {
          setScreen("list");
          setEditTarget(null);
        }
      }
    );
  }
  if (screen === "delete") {
    const s = servers[sel];
    return /* @__PURE__ */ React3.createElement(Box3, { flexDirection: "column", paddingX: 2, paddingY: 1 }, /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: "red" }, "Delete Server"), /* @__PURE__ */ React3.createElement(Box3, { marginTop: 1 }, /* @__PURE__ */ React3.createElement(Text3, null, "Remove "), /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: "yellow" }, '"', s?.name, '"'), /* @__PURE__ */ React3.createElement(Text3, null, "? This cannot be undone.")), /* @__PURE__ */ React3.createElement(Box3, { marginTop: 1 }, /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "Press "), /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: "red" }, "Y"), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, " to confirm, "), /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: "green" }, "N"), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, " or Esc to cancel")));
  }
  return /* @__PURE__ */ React3.createElement(Box3, { flexDirection: "column", paddingX: 1, paddingY: 1 }, /* @__PURE__ */ React3.createElement(Box3, { marginBottom: 1 }, /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: "cyan" }, "LocalRun  "), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "localhost server manager")), servers.length === 0 ? /* @__PURE__ */ React3.createElement(Box3, { marginBottom: 1 }, /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "No servers yet \u2014 press "), /* @__PURE__ */ React3.createElement(Text3, { color: "green" }, "a"), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, " to add one.")) : /* @__PURE__ */ React3.createElement(Box3, { flexDirection: "column", marginBottom: 1 }, servers.map((server, i) => {
    const isSelected = i === sel;
    const runInfo = running[server.id];
    const alive = !!runInfo;
    const portStr = runInfo?.port ? `:${runInfo.port}` : null;
    return /* @__PURE__ */ React3.createElement(Box3, { key: server.id, flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React3.createElement(Box3, null, /* @__PURE__ */ React3.createElement(Text3, { color: isSelected ? "cyan" : "gray", bold: isSelected }, isSelected ? "\u25B6 " : "  "), /* @__PURE__ */ React3.createElement(Text3, { bold: isSelected, color: isSelected ? "white" : void 0 }, server.name), /* @__PURE__ */ React3.createElement(Text3, null, "  "), alive ? /* @__PURE__ */ React3.createElement(Text3, { color: "green" }, "\u25CF ", portStr ? `running ${portStr}` : "starting\u2026") : /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "\u25CB stopped"), copiedId === server.id && /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(Text3, null, "  "), /* @__PURE__ */ React3.createElement(Text3, { color: "cyan", bold: true }, "\u2713 copied"))), /* @__PURE__ */ React3.createElement(Box3, null, /* @__PURE__ */ React3.createElement(Text3, null, "   "), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, (() => {
      const maxCmd = Math.max(15, cols - 28);
      return server.command.length > maxCmd ? server.command.slice(0, maxCmd - 1) + "\u2026" : server.command;
    })()), alive && portStr && cols >= 50 && /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "   "), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, localIP.current, portStr)), server.startAtLogin && /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "  "), /* @__PURE__ */ React3.createElement(Text3, { color: "yellow", dimColor: true }, "\u21BA login"))));
  })), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "\u2500".repeat(Math.max(10, cols - 4))), /* @__PURE__ */ React3.createElement(Box3, { marginTop: 1, flexDirection: "column" }, /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "\u2191\u2193 navigate   Enter / Space start\xB7stop   c copy url"), /* @__PURE__ */ React3.createElement(Box3, { marginTop: 0 }, /* @__PURE__ */ React3.createElement(Text3, { color: "green" }, "a"), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "dd  "), /* @__PURE__ */ React3.createElement(Text3, { color: "yellow" }, "e"), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "dit  "), /* @__PURE__ */ React3.createElement(Text3, { color: "red" }, "d"), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "elete  "), /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, "? help  q quit"))));
}

// bin/localrun.js
process.stdout.write("\x1B[2J\x1B[H");
render(React4.createElement(App), { exitOnCtrlC: true });
