"use strict";

const fastify = require("fastify");
const cors = require("@fastify/cors");

function createServer(options = {}) {
  const { port = 3000, host = 'localhost', cdpPort = 9222 } = options;
  
  const app = fastify({ logger: true });
  
  // Register CORS
  app.register(cors, {
    origin: true
  });
  
  // Health check
  app.get('/health', async (request, reply) => {
    return { status: 'ok', service: 'Chrome MCP Server' };
  });
  
  // MCP endpoint
  app.post('/mcp', async (request, reply) => {
    try {
      // Basic MCP protocol handling
      const { method, params } = request.body;
      
      if (method === 'initialize') {
        return {
          jsonrpc: '2.0',
          id: request.body.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: true },
              resources: { listChanged: true }
            },
            serverInfo: {
              name: 'chrome-mcp-server',
              version: '1.0.29'
            }
          }
        };
      }
      
      if (method === 'tools/list') {
        return {
          jsonrpc: '2.0',
          id: request.body.id,
          result: {
            tools: [
              {
                name: 'browser_navigate',
                description: 'Navigate to a URL',
                inputSchema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', description: 'URL to navigate to' }
                  },
                  required: ['url']
                }
              },
              {
                name: 'browser_screenshot',
                description: 'Take a screenshot',
                inputSchema: {
                  type: 'object',
                  properties: {}
                }
              }
            ]
          }
        };
      }
      
      // Default response for unhandled methods
      return {
        jsonrpc: '2.0',
        id: request.body.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.body.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message
        }
      };
    }
  });
  
  return app;
}

module.exports = { createServer };