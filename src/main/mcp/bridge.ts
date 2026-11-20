// Stdio bridge for MCP clients that start a local command, such as Claude
// Desktop. The app's own executable runs this script in Node mode:
//
//   ELECTRON_RUN_AS_NODE=1 <app executable> <path>/mcp-bridge.js --config <path>/mcp.json
//
// The bridge reads JSON-RPC messages from stdin, sends them to the running
// app's local endpoint and writes the replies to stdout. It reads the token
// from the app's settings file, so the client configuration holds no secret.
// This file must not import Electron.

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

interface BridgeConfig {
  enabled: boolean;
  token: string;
  port: number;
}

type Message = { jsonrpc: '2.0'; id?: string | number | null; method?: string };

const args = process.argv.slice(2);
const configPath = args[args.indexOf('--config') + 1];

function loadConfig(): BridgeConfig {
  try {
    const raw = JSON.parse(readFileSync(configPath, 'utf8')) as Partial<BridgeConfig>;
    return { enabled: raw.enabled === true, token: String(raw.token ?? ''), port: Number(raw.port) || 47821 };
  } catch {
    return { enabled: false, token: '', port: 47821 };
  }
}

function write(msg: unknown): void {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function errorFor(msg: Message, message: string): void {
  if (msg.id === undefined) return;
  write({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message } });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let config = loadConfig();
let launched = false;

function launchApp(): void {
  // Start the app itself, without Node mode.
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  spawn(process.execPath, [], { detached: true, stdio: 'ignore', env }).unref();
}

async function post(body: string, retried = false): Promise<Response> {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${config.port}/mcp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: `Bearer ${config.token}` },
        body,
      });
      // The user made a new token in the app, or the port changed. Read the settings and try once more.
      if (res.status === 401 && !retried) {
        config = loadConfig();
        return post(body, true);
      }
      return res;
    } catch {
      if (!launched) {
        launched = true;
        launchApp();
      }
      config = loadConfig();
      await sleep(500);
    }
  }
  throw new Error('OwnYourNiimbot did not start. Open the app and try again.');
}

async function handle(line: string): Promise<void> {
  let msg: Message;
  try {
    msg = JSON.parse(line) as Message;
  } catch {
    write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  if (!config.enabled) config = loadConfig();
  if (!config.enabled) {
    errorFor(msg, 'AI assistant access is off. Turn it on in OwnYourNiimbot, Settings, AI assistants.');
    return;
  }
  try {
    const res = await post(line);
    if (res.status === 202) return;
    const type = res.headers.get('content-type') ?? '';
    const text = await res.text();
    if (type.includes('text/event-stream')) {
      for (const l of text.split('\n')) if (l.startsWith('data:')) process.stdout.write(`${l.slice(5).trim()}\n`);
    } else if (text) {
      const parsed = JSON.parse(text) as unknown;
      for (const m of Array.isArray(parsed) ? parsed : [parsed]) write(m);
    }
  } catch (err) {
    errorFor(msg, (err as Error).message);
  }
}

if (!configPath) {
  process.stderr.write('Usage: mcp-bridge.js --config <path to mcp.json>\n');
  process.exit(2);
}

const rl = createInterface({ input: process.stdin });
let queue = Promise.resolve();
rl.on('line', (line) => {
  if (line.trim()) queue = queue.then(() => handle(line));
});
rl.on('close', () => {
  void queue.then(() => process.exit(0));
});
