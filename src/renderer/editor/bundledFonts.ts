// Fonts that ship with the app, so labels look the same on every computer
// and print without an internet connection. All are under the SIL Open Font
// Licence 1.1 or the Apache Licence 2.0. Refer to THIRD_PARTY_LICENSES.txt.

import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-ext-700.css';
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-ext-400.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/latin-ext-600.css';
import '@fontsource/montserrat/latin-800.css';
import '@fontsource/montserrat/latin-ext-800.css';
import '@fontsource/oswald/latin-400.css';
import '@fontsource/oswald/latin-ext-400.css';
import '@fontsource/oswald/latin-700.css';
import '@fontsource/oswald/latin-ext-700.css';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource/bebas-neue/latin-ext-400.css';
import '@fontsource/archivo-black/latin-400.css';
import '@fontsource/archivo-black/latin-ext-400.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-ext-400.css';
import '@fontsource/playfair-display/latin-700.css';
import '@fontsource/playfair-display/latin-ext-700.css';
import '@fontsource/playfair-display/latin-400-italic.css';
import '@fontsource/playfair-display/latin-ext-400-italic.css';
import '@fontsource/playfair-display/latin-700-italic.css';
import '@fontsource/playfair-display/latin-ext-700-italic.css';
import '@fontsource/abril-fatface/latin-400.css';
import '@fontsource/abril-fatface/latin-ext-400.css';
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-ext-400.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/cinzel/latin-ext-700.css';
import '@fontsource/roboto-slab/latin-400.css';
import '@fontsource/roboto-slab/latin-ext-400.css';
import '@fontsource/roboto-slab/latin-700.css';
import '@fontsource/roboto-slab/latin-ext-700.css';
import '@fontsource/pacifico/latin-400.css';
import '@fontsource/pacifico/latin-ext-400.css';
import '@fontsource/great-vibes/latin-400.css';
import '@fontsource/great-vibes/latin-ext-400.css';
import '@fontsource/dancing-script/latin-400.css';
import '@fontsource/dancing-script/latin-ext-400.css';
import '@fontsource/dancing-script/latin-700.css';
import '@fontsource/dancing-script/latin-ext-700.css';
import '@fontsource/caveat/latin-400.css';
import '@fontsource/caveat/latin-ext-400.css';
import '@fontsource/caveat/latin-700.css';
import '@fontsource/caveat/latin-ext-700.css';
import '@fontsource/permanent-marker/latin-400.css';
import '@fontsource/amatic-sc/latin-400.css';
import '@fontsource/amatic-sc/latin-ext-400.css';
import '@fontsource/amatic-sc/latin-700.css';
import '@fontsource/amatic-sc/latin-ext-700.css';
import '@fontsource/fredoka/latin-400.css';
import '@fontsource/fredoka/latin-ext-400.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-ext-600.css';
import '@fontsource/righteous/latin-400.css';
import '@fontsource/righteous/latin-ext-400.css';
import '@fontsource/space-mono/latin-400.css';
import '@fontsource/space-mono/latin-ext-400.css';
import '@fontsource/space-mono/latin-700.css';
import '@fontsource/space-mono/latin-ext-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-ext-400.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/jetbrains-mono/latin-ext-700.css';

export interface BundledFont {
  family: string;
  style: string;
  /** Weights, with "-italic" for italic faces. */
  faces: string[];
}

export const BUNDLED_FONTS: BundledFont[] = [
  { family: 'Inter', style: 'Sans', faces: ['400', '700'] },
  { family: 'Montserrat', style: 'Sans', faces: ['400', '600', '800'] },
  { family: 'Oswald', style: 'Condensed', faces: ['400', '700'] },
  { family: 'Bebas Neue', style: 'Display', faces: ['400'] },
  { family: 'Archivo Black', style: 'Display', faces: ['400'] },
  { family: 'Playfair Display', style: 'Serif', faces: ['400', '700', '400-italic', '700-italic'] },
  { family: 'Abril Fatface', style: 'Display', faces: ['400'] },
  { family: 'Cinzel', style: 'Serif', faces: ['400', '700'] },
  { family: 'Roboto Slab', style: 'Serif', faces: ['400', '700'] },
  { family: 'Pacifico', style: 'Script', faces: ['400'] },
  { family: 'Great Vibes', style: 'Script', faces: ['400'] },
  { family: 'Dancing Script', style: 'Script', faces: ['400', '700'] },
  { family: 'Caveat', style: 'Handwriting', faces: ['400', '700'] },
  { family: 'Permanent Marker', style: 'Handwriting', faces: ['400'] },
  { family: 'Amatic SC', style: 'Handwriting', faces: ['400', '700'] },
  { family: 'Fredoka', style: 'Rounded', faces: ['400', '600'] },
  { family: 'Righteous', style: 'Display', faces: ['400'] },
  { family: 'Space Mono', style: 'Monospace', faces: ['400', '700'] },
  { family: 'JetBrains Mono', style: 'Monospace', faces: ['400', '700'] },
];

let ready: Promise<void> | undefined;

/** Loads every bundled face. Text must not be measured before this finishes. */
export function loadBundledFonts(): Promise<void> {
  ready ??= Promise.all(
    BUNDLED_FONTS.flatMap((f) =>
      f.faces.map((face) => {
        const [weight, italic] = face.split('-');
        return document.fonts.load(`${italic ? 'italic ' : ''}${weight} 20px "${f.family}"`).catch(() => []);
      }),
    ),
  ).then(() => undefined);
  return ready;
}
