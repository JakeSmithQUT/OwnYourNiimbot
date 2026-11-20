import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { checkRequest } from './guard';
import { registerTools, SERVER_INSTRUCTIONS, type ToolBridge } from './tools';
import type { McpConfig } from './config';

const MAX_BODY = 1024 * 1024;
/** Requests that the server works on at the same time. A print can take minutes. */
const MAX_ACTIVE = 8;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

let http: Server | undefined;
let activePort: number | undefined;

export function mcpStatus(): { running: boolean; port?: number } {
  return { running: Boolean(http), port: activePort };
}

function send(res: ServerResponse, status: number, message: string, close = false): void {
  if (res.headersSent || res.writableEnded || res.destroyed) return;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (close) headers.connection = 'close';
  res.writeHead(status, headers);
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message }, id: null }));
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    let done = false;
    const onData = (c: Buffer) => {
      size += c.length;
      if (done) {
        // Read and drop the rest, so that the client can read the reply. Close a connection that sends much more.
        if (size > MAX_BODY * 8) req.socket.destroy();
        return;
      }
      if (size > MAX_BODY) {
        done = true;
        chunks.length = 0;
        reject(new HttpError(413, 'The request is too large.'));
        return;
      }
      chunks.push(c);
    };
    req.on('data', onData);
    req.on('end', () => {
      if (done) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'The request is not valid JSON.'));
      }
    });
    req.on('error', (err) => {
      if (!done) reject(err);
    });
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
  let active = 0;
  const server = createServer((req, res) => {
    // A closed connection can raise errors on these streams. They must not stop the app.
    req.on('error', () => undefined);
    res.on('error', () => undefined);
    const check = checkRequest({ method: req.method, url: req.url, headers: req.headers, remoteAddress: req.socket.remoteAddress }, port, config.token);
    if (!check.ok) {
      send(res, check.status, check.message);
      return;
    }
    if (active >= MAX_ACTIVE) {
      send(res, 503, 'The app is busy with other requests. Try again soon.', true);
      return;
    }
    active++;
    res.on('close', () => active--);
    void (async () => {
      let body: unknown;
      try {
        body = await readBody(req);
      } catch (err) {
        const status = err instanceof HttpError ? err.status : 400;
        send(res, status, (err as Error).message, status === 413);
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
        // Keep internal details, for example file paths, out of the reply.
        console.error('MCP request failed:', err);
        send(res, 500, 'The request failed.');
      }
    })().catch(() => undefined);
  });
  // These limits apply to receiving the request. The reply to a print can take longer.
  server.requestTimeout = 30 * 1000;
  server.headersTimeout = 10 * 1000;
  server.keepAliveTimeout = 5 * 1000;
  server.on('clientError', (_err, socket) => socket.destroy());

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
