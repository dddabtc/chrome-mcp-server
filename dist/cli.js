#!/usr/bin/env node
"use strict";

// Chrome MCP Server - Standalone version
// Based on mcp-chrome-bridge by hangye

const { program } = require("commander");
const { createServer } = require("./server");
const { createMcpServer } = require("./mcp/mcp-server-stdio");

program
  .version(require('../package.json').version)
  .description('Chrome MCP Server - Standalone Chrome automation server');

// Start HTTP server
program
  .option('-p, --port <port>', 'HTTP server port', '3000')
  .option('--cdp-port <port>', 'Chrome DevTools Protocol port', '9222')
  .option('--host <host>', 'Server host', 'localhost')
  .action(async (options) => {
    try {
      console.log(`Starting Chrome MCP Server on ${options.host}:${options.port}`);
      console.log(`Chrome CDP port: ${options.cdpPort}`);
      
      process.env.CDP_PORT = options.cdpPort;
      process.env.MCP_SERVER_PORT = options.port;
      
      const server = createServer({
        port: parseInt(options.port),
        host: options.host,
        cdpPort: parseInt(options.cdpPort)
      });
      
      await server.listen({
        port: parseInt(options.port),
        host: options.host
      });
      
      console.log(`✓ Chrome MCP Server listening on http://${options.host}:${options.port}`);
      console.log('Ready to accept MCP connections');
    } catch (error) {
      console.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    }
  });

// MCP stdio mode
program
  .command('stdio')
  .description('Start MCP server in stdio mode')
  .option('--cdp-port <port>', 'Chrome DevTools Protocol port', '9222')
  .action(async (options) => {
    try {
      process.env.CDP_PORT = options.cdpPort;
      
      const mcpServer = createMcpServer({
        cdpPort: parseInt(options.cdpPort)
      });
      
      await mcpServer.start();
    } catch (error) {
      console.error(`Failed to start MCP stdio server: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();

// If no command, start HTTP server by default
if (process.argv.length === 2) {
  program.parse(['node', 'cli.js']);
}