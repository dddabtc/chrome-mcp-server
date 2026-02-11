"use strict";

// Chrome MCP Server - Main entry point
// Based on mcp-chrome-bridge by hangye

const { createServer } = require("./server");

module.exports = {
  createServer
};

// If run directly
if (require.main === module) {
  const port = process.env.MCP_SERVER_PORT || 3000;
  const cdpPort = process.env.CDP_PORT || 9222;
  
  const server = createServer({
    port: parseInt(port),
    cdpPort: parseInt(cdpPort)
  });
  
  server.listen({ port: parseInt(port), host: 'localhost' })
    .then(() => {
      console.log(`Chrome MCP Server listening on http://localhost:${port}`);
      console.log(`Chrome CDP port: ${cdpPort}`);
    })
    .catch((error) => {
      console.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    });
}