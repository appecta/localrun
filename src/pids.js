import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const PIDS_FILE = join(homedir(), '.config', 'localrun', 'pids.json');

export function loadPids() {
  if (!existsSync(PIDS_FILE)) return {};
  try { return JSON.parse(readFileSync(PIDS_FILE, 'utf8')); } catch { return {}; }
}

export function savePids(pids) {
  writeFileSync(PIDS_FILE, JSON.stringify(pids, null, 2));
}

export function isPidRunning(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}
