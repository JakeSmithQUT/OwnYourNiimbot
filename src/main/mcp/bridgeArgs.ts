/**
 * The path of the app's settings file for the MCP bridge: the value after
 * `--config`, or else the first argument that is not an option. The second
 * form needs no option after the command, so the setup command for Claude Code
 * works the same in PowerShell, Command Prompt and other shells.
 */
export function configArg(args: string[]): string | undefined {
  const i = args.indexOf('--config');
  if (i >= 0) return args[i + 1] && !args[i + 1].startsWith('-') ? args[i + 1] : undefined;
  return args.find((a) => !a.startsWith('-'));
}
