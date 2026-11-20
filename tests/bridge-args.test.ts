import { describe, expect, it } from 'vitest';
import { configArg } from '../src/main/mcp/bridgeArgs';

describe('MCP bridge arguments', () => {
  const file = 'C:\\Users\\me\\AppData\\Roaming\\OwnYourNiimbot\\mcp.json';

  it('takes the settings file as the first argument', () => {
    expect(configArg([file])).toBe(file);
  });

  it('still takes "--config <file>" from earlier setups', () => {
    expect(configArg(['--config', file])).toBe(file);
    expect(configArg(['--verbose', '--config', file])).toBe(file);
  });

  it('has no settings file when none is given', () => {
    expect(configArg([])).toBeUndefined();
    expect(configArg(['--config'])).toBeUndefined();
    expect(configArg(['--config', '--other'])).toBeUndefined();
  });
});
