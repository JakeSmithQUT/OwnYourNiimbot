import { app } from 'electron';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface McpConfig {
  /** The server runs only when this is true. Off by default. */
  enabled: boolean;
  /** Bearer token that clients must send. */
  token: string;
  /** First port to try. The server tries the next nine if it is in use. */
  port: number;
  /** Ask the user before an assistant prints. */
  confirmPrint: boolean;
}

export const DEFAULT_PORT = 47821;

export function configPath(): string {
  return join(app.getPath('userData'), 'mcp.json');
}

export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function loadConfig(): Promise<McpConfig> {
  let raw: Partial<McpConfig> = {};
  try {
    raw = JSON.parse(await readFile(configPath(), 'utf8')) as Partial<McpConfig>;
  } catch {
    raw = {};
  }
  const config: McpConfig = {
    enabled: raw.enabled === true,
    token: typeof raw.token === 'string' && raw.token.length >= 32 ? raw.token : newToken(),
    port: typeof raw.port === 'number' && Number.isInteger(raw.port) && raw.port >= 1024 && raw.port <= 65525 ? raw.port : DEFAULT_PORT,
    confirmPrint: raw.confirmPrint !== false,
  };
  if (config.token !== raw.token) await saveConfig(config);
  return config;
}

export async function saveConfig(config: McpConfig): Promise<void> {
  // The file holds the token, so only the user can read it on macOS and Linux.
  await writeFile(configPath(), JSON.stringify(config, null, 2), { encoding: 'utf8', mode: 0o600 });
}
