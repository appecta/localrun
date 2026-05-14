import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.config', 'localrun');
const CONFIG_FILE = join(CONFIG_DIR, 'servers.json');
const ZSHRC_MARKER = '# localrun-cli';

const DEFAULT_CONFIG = { servers: [], welcomeSeen: false, zshrcAdded: false };

export function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG };
  try {
    const raw = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    // backwards compat: old format was a plain array
    if (Array.isArray(raw)) return { ...DEFAULT_CONFIG, servers: raw };
    return { ...DEFAULT_CONFIG, ...raw };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function addToZshrc(scriptPath) {
  const zshrcPath = join(homedir(), '.zshrc');
  let content = existsSync(zshrcPath) ? readFileSync(zshrcPath, 'utf8') : '';
  if (content.includes(ZSHRC_MARKER)) return;
  appendFileSync(zshrcPath, `\n${ZSHRC_MARKER}\nalias localrun="node ${scriptPath}"\n`);
}

export function removeFromZshrc() {
  const zshrcPath = join(homedir(), '.zshrc');
  if (!existsSync(zshrcPath)) return;
  const content = readFileSync(zshrcPath, 'utf8');
  const cleaned = content.replace(new RegExp(`\\n?${ZSHRC_MARKER}\\nalias localrun="[^"]*"\\n?`, 'g'), '');
  writeFileSync(zshrcPath, cleaned);
}
