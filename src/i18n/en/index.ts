// The English catalogue: the source text of the app and the fallback for
// every other language. Each area has its own file.

import { common } from './common';
import { settings } from './settings';
import { dialogs } from './dialogs';
import { editor } from './editor';
import { views } from './views';
import { system } from './system';
import { changelog } from './changelog';

export const en = { ...common, ...settings, ...dialogs, ...editor, ...views, ...system, ...changelog };

export type MessageKey = keyof typeof en;
