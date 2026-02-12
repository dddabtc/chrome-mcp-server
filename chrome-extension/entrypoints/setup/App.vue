<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { NATIVE_HOST } from '@/common/constants';

const HOST_NAME = NATIVE_HOST.NAME;
const NPM_PACKAGE = 'chrome-mcp-server';

const platform = ref<'windows' | 'mac' | 'linux'>('mac');
const status = ref<'pending' | 'checking' | 'connected'>('pending');
const statusMessage = ref('Native messaging host is not registered.');
let checkInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // Detect platform
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) {
    platform.value = 'windows';
  } else if (ua.includes('mac') || ua.includes('darwin')) {
    platform.value = 'mac';
  } else {
    platform.value = 'linux';
  }

  // Start polling for connection
  startConnectionCheck();
});

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval);
});

function startConnectionCheck() {
  checkInterval = setInterval(async () => {
    status.value = 'checking';
    try {
      const response = await chrome.runtime.sendMessage({ type: 'PING_NATIVE' });
      if (response?.connected) {
        status.value = 'connected';
        statusMessage.value = '✅ Native host connected successfully! You can close this page.';
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
      } else {
        status.value = 'pending';
        statusMessage.value = 'Waiting for native host connection...';
      }
    } catch {
      status.value = 'pending';
      statusMessage.value = 'Waiting for native host connection...';
    }
  }, 3000);
}

function downloadScript() {
  if (platform.value === 'windows') {
    downloadFile('install-native-host.bat', generateWindowsScript());
  } else {
    downloadFile('install-native-host.sh', generateUnixScript());
  }
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getExtensionId(): string {
  return chrome.runtime.id;
}

function generateUnixScript(): string {
  const extId = getExtensionId();
  return `#!/usr/bin/env bash
set -e

# Chrome MCP Server - Native Messaging Host Installer
# This script installs the native messaging host for the Chrome MCP Server extension.

HOST_NAME="${HOST_NAME}"
PACKAGE_NAME="${NPM_PACKAGE}"
EXTENSION_ID="${extId}"

echo "============================================"
echo "  Chrome MCP Server - Native Host Setup"
echo "============================================"
echo ""

# Step 1: Check for Node.js
echo "Checking for Node.js..."
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Please install Node.js (v20+) from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Found Node.js \${NODE_VERSION}"

# Step 2: Install the package globally
echo ""
echo "Installing \${PACKAGE_NAME} globally..."
if command -v pnpm &>/dev/null; then
    pnpm add -g "\${PACKAGE_NAME}"
elif command -v yarn &>/dev/null; then
    yarn global add "\${PACKAGE_NAME}"
else
    npm install -g "\${PACKAGE_NAME}"
fi

# Step 3: Find the installed package location
echo ""
echo "Locating installed package..."
PACKAGE_DIR=""

# Try npm
if command -v npm &>/dev/null; then
    NPM_ROOT=$(npm root -g 2>/dev/null || true)
    if [ -d "\${NPM_ROOT}/\${PACKAGE_NAME}" ]; then
        PACKAGE_DIR="\${NPM_ROOT}/\${PACKAGE_NAME}"
    fi
fi

# Try pnpm
if [ -z "\${PACKAGE_DIR}" ] && command -v pnpm &>/dev/null; then
    PNPM_ROOT=$(pnpm root -g 2>/dev/null || true)
    if [ -d "\${PNPM_ROOT}/\${PACKAGE_NAME}" ]; then
        PACKAGE_DIR="\${PNPM_ROOT}/\${PACKAGE_NAME}"
    fi
fi

if [ -z "\${PACKAGE_DIR}" ]; then
    echo "ERROR: Could not locate installed package."
    echo "Please run: \${PACKAGE_NAME} register"
    exit 1
fi

echo "Package found at: \${PACKAGE_DIR}"

# Step 4: Find the host script
HOST_SCRIPT="\${PACKAGE_DIR}/dist/run_host.sh"
if [ ! -f "\${HOST_SCRIPT}" ]; then
    # Fallback: try index.js directly
    HOST_SCRIPT="\${PACKAGE_DIR}/dist/index.js"
fi

if [ ! -f "\${HOST_SCRIPT}" ]; then
    echo "ERROR: Host script not found."
    echo "Please run: \${PACKAGE_NAME} register"
    exit 1
fi

chmod +x "\${HOST_SCRIPT}" 2>/dev/null || true

# Step 5: Determine manifest directory
OS_TYPE=$(uname -s)
if [ "\${OS_TYPE}" = "Darwin" ]; then
    MANIFEST_DIR="\${HOME}/Library/Application Support/Google/Chrome/NativeMessagingHosts"
else
    MANIFEST_DIR="\${HOME}/.config/google-chrome/NativeMessagingHosts"
fi

mkdir -p "\${MANIFEST_DIR}"

# Step 6: Write manifest
MANIFEST_PATH="\${MANIFEST_DIR}/\${HOST_NAME}.json"

cat > "\${MANIFEST_PATH}" << MANIFEST_EOF
{
  "name": "\${HOST_NAME}",
  "description": "Node.js Host for Chrome MCP Server Extension",
  "path": "\${HOST_SCRIPT}",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://\${EXTENSION_ID}/"
  ]
}
MANIFEST_EOF

echo ""
echo "============================================"
echo "  ✅ Installation Complete!"
echo "============================================"
echo ""
echo "Manifest written to: \${MANIFEST_PATH}"
echo "Host script: \${HOST_SCRIPT}"
echo ""
echo "Please go back to the Chrome extension setup page."
echo "The extension will automatically detect the connection."
echo ""
`;
}

function generateWindowsScript(): string {
  const extId = getExtensionId();
  return `@echo off
setlocal enabledelayedexpansion

REM Chrome MCP Server - Native Messaging Host Installer
REM This script installs the native messaging host for the Chrome MCP Server extension.

set "HOST_NAME=${HOST_NAME}"
set "PACKAGE_NAME=${NPM_PACKAGE}"
set "EXTENSION_ID=${extId}"

echo ============================================
echo   Chrome MCP Server - Native Host Setup
echo ============================================
echo.

REM Step 1: Check for Node.js
echo Checking for Node.js...
where node.exe >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js ^(v20+^) from https://nodejs.org
    pause
    exit /B 1
)

for /f "delims=" %%v in ('node -v') do set "NODE_VERSION=%%v"
echo Found Node.js %NODE_VERSION%

REM Step 2: Install the package globally
echo.
echo Installing %PACKAGE_NAME% globally...
call npm install -g %PACKAGE_NAME%
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install %PACKAGE_NAME%.
    pause
    exit /B 1
)

REM Step 3: Find the installed package location
echo.
echo Locating installed package...
set "PACKAGE_DIR="

for /f "delims=" %%i in ('npm root -g 2^>nul') do set "NPM_ROOT=%%i"
if exist "%NPM_ROOT%\\%PACKAGE_NAME%" (
    set "PACKAGE_DIR=%NPM_ROOT%\\%PACKAGE_NAME%"
)

if not defined PACKAGE_DIR (
    echo ERROR: Could not locate installed package.
    echo Please run: %PACKAGE_NAME% register
    pause
    exit /B 1
)

echo Package found at: %PACKAGE_DIR%

REM Step 4: Find the host script
set "HOST_SCRIPT=%PACKAGE_DIR%\\dist\\run_host.bat"
if not exist "%HOST_SCRIPT%" (
    set "HOST_SCRIPT=%PACKAGE_DIR%\\dist\\index.js"
)

if not exist "%HOST_SCRIPT%" (
    echo ERROR: Host script not found.
    echo Please run: %PACKAGE_NAME% register
    pause
    exit /B 1
)

REM Step 5: Write registry key
set "REG_KEY=HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\%HOST_NAME%"
set "MANIFEST_DIR=%LOCALAPPDATA%\\ChromeMCPServer"
set "MANIFEST_PATH=%MANIFEST_DIR%\\%HOST_NAME%.json"

if not exist "%MANIFEST_DIR%" mkdir "%MANIFEST_DIR%"

REM Step 6: Write manifest JSON
echo {> "%MANIFEST_PATH%"
echo   "name": "%HOST_NAME%",>> "%MANIFEST_PATH%"
echo   "description": "Node.js Host for Chrome MCP Server Extension",>> "%MANIFEST_PATH%"
echo   "path": "%HOST_SCRIPT%",>> "%MANIFEST_PATH%"
echo   "type": "stdio",>> "%MANIFEST_PATH%"
echo   "allowed_origins": [>> "%MANIFEST_PATH%"
echo     "chrome-extension://%EXTENSION_ID%/">> "%MANIFEST_PATH%"
echo   ]>> "%MANIFEST_PATH%"
echo }>> "%MANIFEST_PATH%"

REM Step 7: Register in Windows Registry
reg add "%REG_KEY%" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo WARNING: Failed to add registry key. You may need to run as Administrator.
    pause
    exit /B 1
)

echo.
echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo Manifest: %MANIFEST_PATH%
echo Registry: %REG_KEY%
echo Host script: %HOST_SCRIPT%
echo.
echo Please go back to the Chrome extension setup page.
echo The extension will automatically detect the connection.
echo.
pause
`;
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-8">
    <div class="max-w-2xl w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">🔧 Native Host Setup</h1>
        <p class="text-gray-400">
          Chrome MCP Server needs a native messaging host to communicate with your system.
        </p>
      </div>

      <!-- Status Banner -->
      <div
        class="mb-8 p-4 rounded-lg border"
        :class="{
          'bg-red-950/50 border-red-800 text-red-200': status === 'pending',
          'bg-yellow-950/50 border-yellow-800 text-yellow-200': status === 'checking',
          'bg-green-950/50 border-green-800 text-green-200': status === 'connected',
        }"
      >
        <div class="flex items-center gap-3">
          <div
            v-if="status === 'pending'"
            class="w-3 h-3 rounded-full bg-red-500"
          />
          <div
            v-else-if="status === 'checking'"
            class="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"
          />
          <div
            v-else
            class="w-3 h-3 rounded-full bg-green-500"
          />
          <span>{{ statusMessage }}</span>
        </div>
      </div>

      <!-- Steps (only show when not connected) -->
      <div v-if="status !== 'connected'" class="space-y-6">
        <!-- Step 1 -->
        <div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 class="text-lg font-semibold text-white mb-3">
            Step 1: Download the installer
          </h2>
          <p class="text-gray-400 text-sm mb-4">
            Detected platform: <strong class="text-white">{{ platform === 'windows' ? 'Windows' : platform === 'mac' ? 'macOS' : 'Linux' }}</strong>
          </p>
          <button
            @click="downloadScript"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          >
            {{ platform === 'windows' ? '⬇️ Download install-native-host.bat' : '⬇️ Download install-native-host.sh' }}
          </button>
        </div>

        <!-- Step 2 -->
        <div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 class="text-lg font-semibold text-white mb-3">
            Step 2: Run the installer
          </h2>
          <div v-if="platform === 'windows'" class="text-gray-400 text-sm space-y-2">
            <p>1. Open the downloaded <code class="text-blue-400">install-native-host.bat</code> file</p>
            <p>2. If prompted by Windows Defender SmartScreen, click "More info" → "Run anyway"</p>
            <p>3. Wait for the installation to complete</p>
          </div>
          <div v-else class="text-gray-400 text-sm space-y-2">
            <p>Open Terminal and run:</p>
            <div class="mt-2 bg-gray-950 rounded p-3 font-mono text-sm text-green-400">
              chmod +x ~/Downloads/install-native-host.sh && ~/Downloads/install-native-host.sh
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 class="text-lg font-semibold text-white mb-3">
            Step 3: Wait for connection
          </h2>
          <p class="text-gray-400 text-sm">
            This page will automatically detect when the native host is registered and connected.
            The status banner above will turn green when ready.
          </p>
        </div>

        <!-- Alternative -->
        <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
          <h3 class="text-sm font-medium text-gray-300 mb-2">Alternative: Manual installation</h3>
          <p class="text-gray-500 text-sm">
            You can also install manually via terminal:
          </p>
          <div class="mt-2 bg-gray-950 rounded p-3 font-mono text-xs text-gray-400">
            npm install -g {{ NPM_PACKAGE }} &amp;&amp; mcp-chrome-bridge register
          </div>
        </div>
      </div>

      <!-- Success state -->
      <div v-else class="bg-gray-900 rounded-lg p-8 border border-green-800 text-center">
        <div class="text-5xl mb-4">🎉</div>
        <h2 class="text-xl font-bold text-white mb-2">All Set!</h2>
        <p class="text-gray-400">
          The native messaging host is connected and running.
          You can now use Chrome MCP Server.
        </p>
      </div>
    </div>
  </div>
</template>
