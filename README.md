# ChromeCP

A standalone Chrome MCP (Model Context Protocol) server with multi-session support and automatic setup guide.

> **Fork of [mcp-chrome](https://github.com/hangwin/mcp-chrome) by [@hangye](https://github.com/hangwin)**
> Enhanced with: automatic native host setup wizard, multi-session fix, and streamlined `npm install -g` workflow.

## Features

- **One-Command Install**: `npm install -g chromecp` — includes auto-setup guide for native messaging host
- **Multi-Session Support**: Multiple MCP clients can connect simultaneously without conflicts
- **Chrome Extension**: Full-featured browser extension for page interaction and automation
- **Native Server**: MCP server with both Streamable HTTP and SSE transport support
- **Session Management**: Database-backed session persistence with SQLite

## Installation

### Global Installation (Recommended)

```bash
npm install -g chromecp
```

Then run:

```bash
chromecp
```

### From Source

```bash
git clone https://github.com/dddabtc/chromecp.git
cd chromecp
npm install
```

## Usage

### Starting the MCP Server

```bash
# Using global installation
chromecp

# Alternative command names (backward compatible)
chrome-mcp-server
mcp-chrome-bridge
chrome-mcp-bridge

# For stdio mode (Claude Desktop, etc.)
mcp-chrome-stdio
```

### Chrome Extension Setup

1. **Install the extension** in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension/.output/chrome-mv3` directory

2. **Automatic Native Host Setup**:
   - On first load, a **setup guide page** opens automatically
   - Download the install script for your platform (Windows `.bat` / macOS+Linux `.sh`)
   - Run it — handles native host registration in one step
   - Reload the extension and it connects automatically

### Configuration

```env
CHROME_MCP_PORT=8080
CHROME_CDP_PORT=9222
LOG_LEVEL=info
```

## Multi-Session Support

Includes Howard's multi-session fix ([PR #295](https://github.com/hangwin/mcp-chrome/pull/295)) — multiple MCP clients can connect to the same server simultaneously.

## Architecture

```
Chrome Extension (Browser)
    ↕
Native Messaging Host
    ↕
MCP Server (chromecp)
    ↕
MCP Clients (Claude, etc.)
```

## Acknowledgments

Based on the excellent work by [@hangye](https://github.com/hangwin) — [mcp-chrome](https://github.com/hangwin/mcp-chrome).

## License

MIT
