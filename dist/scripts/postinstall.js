#!/usr/bin/env node
"use strict";

/**
 * chrome-mcp-server postinstall script
 * Automatically registers Chrome Native Messaging host on install.
 * 
 * This is a self-contained script that writes the NativeMessagingHosts manifest
 * so users don't need to run a separate registration step.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const HOST_NAME = 'com.chromemcp.nativehost';
const EXTENSION_ID = 'hbdgbgagpkpjffpklnamcljpakneikee';
const DESCRIPTION = 'Node.js Host for Browser Bridge Extension';

function log(msg, color) {
  const colors = { green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', red: '\x1b[31m', reset: '\x1b[0m' };
  console.log(`${colors[color] || ''}${msg}${colors.reset}`);
}

/**
 * Get user-level manifest directory for each platform/browser
 */
function getManifestPaths() {
  const home = os.homedir();
  const platform = os.platform();
  const paths = [];

  if (platform === 'darwin') {
    paths.push(path.join(home, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts'));
    paths.push(path.join(home, 'Library', 'Application Support', 'Chromium', 'NativeMessagingHosts'));
  } else if (platform === 'linux') {
    paths.push(path.join(home, '.config', 'google-chrome', 'NativeMessagingHosts'));
    paths.push(path.join(home, '.config', 'chromium', 'NativeMessagingHosts'));
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    paths.push(path.join(appData, 'Google', 'Chrome', 'NativeMessagingHosts'));
    paths.push(path.join(appData, 'Chromium', 'NativeMessagingHosts'));
  }

  return paths;
}

/**
 * Find the host executable path
 * Looks for run_host.sh/bat in the native-server or in our own dist
 */
function findHostPath() {
  const platform = os.platform();
  const scriptName = platform === 'win32' ? 'run_host.bat' : 'run_host.sh';
  
  // Check common locations relative to this script
  const candidates = [
    // If native-server is a sibling (monorepo structure)
    path.join(__dirname, '..', '..', 'native-server', 'dist', scriptName),
    // If installed as dependency
    path.join(__dirname, '..', '..', 'node_modules', 'mcp-chrome-bridge', 'dist', scriptName),
    // Global npm install - mcp-chrome-bridge might be a sibling
    path.join(__dirname, '..', '..', 'mcp-chrome-bridge', 'dist', scriptName),
    // Our own dist directory  
    path.join(__dirname, '..', scriptName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return path.resolve(candidate);
    }
  }

  // Try to find via npm/global path
  try {
    const { execSync } = require('child_process');
    const npmPrefix = execSync('npm prefix -g', { encoding: 'utf8' }).trim();
    const globalPath = path.join(npmPrefix, 'lib', 'node_modules', 'mcp-chrome-bridge', 'dist', scriptName);
    if (fs.existsSync(globalPath)) return globalPath;
    // npm on some systems puts it directly in node_modules
    const globalPath2 = path.join(npmPrefix, 'node_modules', 'mcp-chrome-bridge', 'dist', scriptName);
    if (fs.existsSync(globalPath2)) return globalPath2;
  } catch (e) {
    // ignore
  }

  return null;
}

/**
 * Create the native messaging host manifest
 */
function createManifest(hostPath) {
  return {
    name: HOST_NAME,
    description: DESCRIPTION,
    path: hostPath,
    type: 'stdio',
    allowed_origins: [
      `chrome-extension://${EXTENSION_ID}/`
    ]
  };
}

function isElevated() {
  if (os.platform() === 'win32') return false;
  return process.getuid?.() === 0;
}

async function main() {
  log('chrome-mcp-server: Auto-registering Native Messaging host...', 'blue');

  // Skip if running as root (would register in wrong home dir)
  if (isElevated()) {
    log('⚠️  Running as root/sudo - skipping auto-registration.', 'yellow');
    log('   Run as normal user: chrome-mcp-server register', 'yellow');
    return;
  }

  const hostPath = findHostPath();
  if (!hostPath) {
    log('⚠️  Could not find native host executable (run_host.sh/bat).', 'yellow');
    log('   You may need to also install mcp-chrome-bridge globally:', 'yellow');
    log('   npm install -g mcp-chrome-bridge', 'yellow');
    return;
  }

  // Ensure executable permission on Unix
  if (os.platform() !== 'win32') {
    try { fs.chmodSync(hostPath, '755'); } catch (e) { /* ignore */ }
  }

  const manifest = createManifest(hostPath);
  const manifestPaths = getManifestPaths();
  let registered = 0;

  for (const dir of manifestPaths) {
    const manifestFile = path.join(dir, `${HOST_NAME}.json`);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
      log(`✓ Registered: ${manifestFile}`, 'green');
      registered++;
    } catch (err) {
      // Skip browsers that don't exist / permission issues
      log(`  Skipped ${dir}: ${err.message}`, 'yellow');
    }
  }

  if (registered > 0) {
    log(`✓ Native Messaging host registered for ${registered} browser(s). No manual step needed!`, 'green');
  } else {
    log('⚠️  Could not register automatically. Run manually:', 'yellow');
    log('   mcp-chrome-bridge register', 'yellow');
  }
}

main().catch(err => {
  log(`Registration error (non-fatal): ${err.message}`, 'yellow');
  // Don't fail the install
});
