// Google Font TTF Loader and Cache
// Fetches TTF buffers from Fontsource CDN (pdf-lib requires TTF/OTF, not WOFF2).

export const AVAILABLE_FONTS = [
  'Playfair Display', 'Cinzel', 'Great Vibes', 'Dancing Script', 'Cormorant Garamond',
  'EB Garamond', 'Libre Baskerville', 'Merriweather', 'Lora', 'Raleway',
  'Montserrat', 'Poppins', 'Inter', 'Nunito', 'Oswald', 'Bebas Neue',
  'Abril Fatface', 'Pacifico', 'Sacramento', 'Allura', 'Alex Brush',
  'Pinyon Script', 'Satisfy', 'Tangerine', 'Italiana', 'Uncial Antiqua',
  'MedievalSharp', 'Almendra', 'Metamorphous', 'Philosopher'
];

const fontCache = new Map<string, ArrayBuffer>();

function fontNameToSlug(fontName: string): string {
  return fontName.toLowerCase().replace(/\s+/g, '-');
}

function buildFontsourceUrl(slug: string, weight: number, style: string): string {
  const styleSuffix = style === 'italic' ? 'italic' : 'normal';
  return `https://cdn.jsdelivr.net/fontsource/fonts/${slug}@latest/latin-${weight}-${styleSuffix}.ttf`;
}

/** Weights to try when the exact weight is unavailable (e.g. display fonts). */
function weightsToTry(requested: number): number[] {
  const candidates = [requested, 400, 700, 300, 500, 600];
  return [...new Set(candidates)];
}

export async function fetchFont(fontName: string, weight = 400, style = 'normal'): Promise<ArrayBuffer> {
  const cacheKey = `${fontName}-${weight}-${style}`;
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!;
  }

  const slug = fontNameToSlug(fontName);
  let lastError: unknown;

  for (const tryWeight of weightsToTry(weight)) {
    const url = buildFontsourceUrl(slug, tryWeight, style);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = new Error(`Font fetch failed (${response.status}): ${url}`);
        continue;
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength === 0) {
        lastError = new Error(`Empty font file: ${url}`);
        continue;
      }

      fontCache.set(cacheKey, buffer);
      return buffer;
    } catch (error) {
      lastError = error;
    }
  }

  console.error(`Error loading font "${fontName}" (weight ${weight}, style ${style}):`, lastError);
  throw lastError ?? new Error(`Could not load font "${fontName}"`);
}

/**
 * Dynamically injects a stylesheet link to Google Fonts for browser preview styling
 */
export function injectFontPreview(fontName: string) {
  if (typeof window === 'undefined') return;
  
  const id = `gf-preview-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:ital,wght@0,100;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap`;
  document.head.appendChild(link);
}
