import { api } from '../api';
import { t } from '../i18n';

const IMAGE_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', svg: 'image/svg+xml' };

/** Asks for an image file and returns it as a data URL, or null if the user cancels. */
export async function pickImage(): Promise<string | null> {
  const file = await api.files.open({ filters: [{ name: t('editor.imageFiles'), extensions: Object.keys(IMAGE_TYPES) }], binary: true });
  if (!file) return null;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  return `data:${IMAGE_TYPES[ext] ?? 'image/png'};base64,${file.data}`;
}
