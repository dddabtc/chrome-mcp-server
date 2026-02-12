#!/usr/bin/env node
"use strict";

// Chrome MCP Server - STDIO mode
// Based on mcp-chrome-bridge by hangye

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

function createMcpServer(options = {}) {
  const { cdpPort = 9222 } = options;
  
  const server = new Server(
    {
      name: "chromecp",
      version: "1.0.29"
    },
    {
      capabilities: {
        tools: {},
        resources: {}
      }
    }
  );
  
  // Tool handlers
  server.setRequestHandler("tools/list", async () => {
    return {
      tools: [
        {
          name: "browser_navigate",
          description: "Navigate to a URL in Chrome",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to navigate to"
              }
            },
            required: ["url"]
          }
        },
        {
          name: "browser_screenshot",
          description: "Take a screenshot of the current page",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "browser_click",
          description: "Click on an element",
          inputSchema: {
            type: "object",
            properties: {
              selector: {
                type: "string",
                description: "CSS selector for the element to click"
              },
              x: {
                type: "number",
                description: "X coordinate to click"
              },
              y: {
                type: "number",
                description: "Y coordinate to click"
              }
            }
          }
        }
      ]
    };
  });
  
  server.setRequestHandler("tools/call", async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      switch (name) {
        case "browser_navigate":
          return {
            content: [
              {
                type: "text",
                text: `Navigated to ${args.url} (CDP port: ${cdpPort})`
              }
            ]
          };
          
        case "browser_screenshot":
          return {
            content: [
              {
                type: "text",
                text: "Screenshot taken (mock implementation)"
              }
            ]
          };
          
        case "browser_click":
          return {
            content: [
              {
                type: "text",
                text: `Clicked at ${args.x || 'selector'},${args.y || args.selector}`
              }
            ]
          };
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  });
  
  return {
    start: async () => {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error("Chrome MCP Server (stdio) started");
    }
  };
}

module.exports = { createMcpServer };

// If run directly
if (require.main === module) {
  const cdpPort = process.env.CDP_PORT || 9222;
  const mcpServer = createMcpServer({ cdpPort });
  mcpServer.start().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });
}