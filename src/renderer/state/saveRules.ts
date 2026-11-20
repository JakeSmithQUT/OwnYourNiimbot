/**
 * True when Save must make a new saved label: the open label is a saved label,
 * and its name changed after it was opened or saved. The saved label with the
 * old name stays as it was, like "Save as".
 */
export function savesAsNewLabel(id: string, name: string, savedName: string | undefined): boolean {
  return Boolean(id) && savedName !== undefined && name.trim() !== savedName.trim();
}
