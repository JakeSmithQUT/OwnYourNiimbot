import { Database, FolderOpen, History, LayoutTemplate, PenTool, Printer } from 'lucide-react';
import type { View } from './state/app';
import type { MessageKey } from '../i18n/translate';

/**
 * The pages in the navigation rail, from top to bottom. The keyboard focus
 * goes through them in this order. Settings is at the bottom of the rail.
 * The "templates" view is the Labels page, and "library" is the Templates page.
 */
export const NAV: { view: View; label: MessageKey; icon: typeof PenTool }[] = [
  { view: 'design', label: 'app.nav.design', icon: PenTool },
  { view: 'templates', label: 'app.nav.labels', icon: FolderOpen },
  { view: 'library', label: 'app.nav.templates', icon: LayoutTemplate },
  { view: 'data', label: 'app.nav.data', icon: Database },
  { view: 'printer', label: 'app.nav.printer', icon: Printer },
  { view: 'history', label: 'app.nav.history', icon: History },
];
