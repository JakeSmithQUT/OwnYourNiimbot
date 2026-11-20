import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { checkRequest } from './guard';
import { registerTools, SERVER_INSTRUCTIONS, type ToolBridge } from './tools';
import type { McpConfig } from './config';

const MAX_BODY = 1024 * 1024;

let http: Server | undefined;
let activePort: number | undefined;

export function mcpStatus(): { running: boolean; port?: number } {
  return { running: Boolean(http), port: activePort };
}

function send(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message }, id: null }));
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('Request is too large.'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('The request is not valid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (err: Error) => {
      server.off('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

/** Starts the local MCP endpoint at http://127.0.0.1:<port>/mcp. Returns the port. */
export async function startMcp(config: McpConfig, bridge: ToolBridge, version: string): Promise<number> {
  await stopMcp();
  let port = config.port;
  const server = createServer((req, res) => {
    const check = checkRequest({ method: req.method, url: req.url, headers: req.headers, remoteAddress: req.socket.remoteAddress }, port, config.token);
    if (!check.ok) {
      send(res, check.status, check.message);
      return;
    }
    void (async () => {
      let body: unknown;
      try {
        body = await readBody(req);
      } catch (err) {
        send(res, 400, (err as Error).message);
        return;
      }
      // Stateless: a new server and transport for each request.
      const mcp = new McpServer({ name: 'ownyourniimbot', version }, { instructions: SERVER_INSTRUCTIONS });
      registerTools(mcp, bridge);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on('close', () => {
        void transport.close();
        void mcp.close();
      });
      try {
        await mcp.connect(transport);
        await transport.handleRequest(req, res, body);
      } catch (err) {
        if (!res.headersSent) send(res, 500, (err as Error).message);
      }
    })();
  });
  server.requestTimeout = 15 * 60 * 1000;

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      await listen(server, config.port + attempt);
      port = config.port + attempt;
      http = server;
      activePort = port;
      return port;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw err;
    }
  }
  throw new Error(`Ports ${config.port} to ${config.port + 9} are in use.`);
}

export async function stopMcp(): Promise<void> {
  const server = http;
  http = undefined;
  activePort = undefined;
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
}
