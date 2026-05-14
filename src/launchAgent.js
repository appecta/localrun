import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';
import { execSync } from 'node:child_process';

const AGENTS_DIR = join(homedir(), 'Library', 'LaunchAgents');
const LABEL = 'com.localrun';

function plistPath(id) {
  return join(AGENTS_DIR, `${LABEL}.${id}.plist`);
}

export function enableLaunchAgent(server) {
  if (platform() !== 'darwin') return;
  mkdirSync(AGENTS_DIR, { recursive: true });

  const logDir = join(homedir(), '.config', 'localrun', 'logs');
  mkdirSync(logDir, { recursive: true });

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
    <string>${server.command.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin'}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${join(logDir, server.id + '.log')}</string>
  <key>StandardErrorPath</key>
  <string>${join(logDir, server.id + '.err.log')}</string>
</dict>
</plist>`;

  const path = plistPath(server.id);
  writeFileSync(path, plist);
  try { execSync(`launchctl load "${path}"`, { stdio: 'ignore' }); } catch {}
}

export function disableLaunchAgent(id) {
  if (platform() !== 'darwin') return;
  const path = plistPath(id);
  if (!existsSync(path)) return;
  try { execSync(`launchctl unload "${path}"`, { stdio: 'ignore' }); } catch {}
  unlinkSync(path);
}
