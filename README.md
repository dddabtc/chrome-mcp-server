# Chrome MCP Server

A standalone Chrome MCP (Model Context Protocol) server with multi-session support, extracted from the excellent work by [@hangye](https://github.com/hangwin/mcp-chrome).

## Features

- **Multi-Session Support**: Multiple MCP clients can connect simultaneously without conflicts (fixes the "Already connected to a transport" error)
- **Chrome Extension**: Full-featured browser extension for page interaction and automation
- **Native Server**: FastAPI-based MCP server with both Streamable HTTP and SSE transport support
- **Session Management**: Database-backed session persistence with SQLite
- **Agent Capabilities**: Integrated AI agents (Claude, Codex) for enhanced functionality

## What's Included

This repository contains two main components:

- **`chrome-extension/`**: Browser extension with compiled Chrome MV3 build
- **`native-server/`**: MCP server with multi-session capabilities
- **`shared/`**: Common utilities and types (bundled inline)

## Installation

### Global Installation (Recommended)

```bash
npm install -g chrome-mcp-server
```

### Local Installation

```bash
git clone https://github.com/dddabtc/chrome-mcp-server.git
cd chrome-mcp-server
npm install
```

## Usage

### Starting the MCP Server

```bash
# Using global installation
chrome-mcp-server

# Or using the alternative command names
mcp-chrome-bridge
chrome-mcp-bridge

# For stdio mode
mcp-chrome-stdio
```

The server will start on the default port (typically 8080) and provide both:
- Streamable HTTP MCP endpoint at `/mcp`
- SSE (Server-Sent Events) transport
- Native Chrome messaging host integration

### Chrome Extension Setup

1. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `chrome-extension/.output/chrome-mv3` directory

2. Configure the extension to connect to your MCP server endpoint

### Configuration

The server can be configured through environment variables or command line arguments. See the native-server documentation for detailed configuration options.

Create a `.env` file for environment-specific settings:

```env
# Example configuration
CHROME_MCP_PORT=8080
CHROME_CDP_PORT=9222
LOG_LEVEL=info
```

## Multi-Session Support

This implementation includes Howard's multi-session fix ([PR #295](https://github.com/hangwin/mcp-chrome/pull/295)) which allows multiple MCP clients to connect to the same server instance simultaneously. This resolves the original limitation where only one client could connect at a time.

### How it Works

- Each MCP client gets a unique session ID
- Transport connections are managed in a Map structure
- Both StreamableHTTP and SSE transports can be used concurrently
- Session state is persisted to SQLite database

## Architecture

```
Chrome Extension (Browser)
    ↕
Native Messaging Host
    ↕
MCP Server (FastAPI)
    ↕
MCP Clients (Claude, etc.)
```

The server acts as a bridge between Chrome's native messaging system and MCP clients, enabling AI agents to interact with web pages through the browser extension.

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build the native server
cd native-server
npm run build

# Build the chrome extension  
cd chrome-extension
npm run build
```

### Testing

```bash
# Run tests for native server
cd native-server
npm test
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the native server is running and Chrome has the correct port configuration
2. **Extension Not Loading**: Check that Chrome Developer Mode is enabled and the extension path is correct
3. **Multi-Session Conflicts**: This implementation should handle multiple clients gracefully - if you encounter issues, check the server logs

### Debugging

Enable debug logging by setting:
```bash
export LOG_LEVEL=debug
chrome-mcp-server
```

## Acknowledgments

This project is based on the excellent [mcp-chrome](https://github.com/hangwin/mcp-chrome) by [@hangye](https://github.com/hangwin). The original work provided the foundation for Chrome-MCP integration.

**Key contributions from the original project:**
- Initial Chrome extension architecture
- Native messaging host implementation  
- MCP protocol integration
- Browser automation capabilities

**Multi-session enhancement by Howard:**
- Fixed transport connection management
- Added support for concurrent MCP clients
- Database-backed session persistence

## License

MIT License - see LICENSE file for details.

## Contributing

Issues and pull requests are welcome! Please ensure any contributions maintain compatibility with the MCP specification and Chrome extension requirements.