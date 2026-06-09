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
  return `https://cdn.jsdelivr.net/fontsource/fonts/${slug}@5/latin-${weight}-${styleSuffix}.ttf`;
}

const FONT_WEIGHTS_MAP: Record<string, number[]> = {
  'playfair-display': [400, 500, 600, 700, 800, 900],
  'cinzel': [400, 500, 600, 700, 800, 900],
  'great-vibes': [400],
  'dancing-script': [400, 500, 600, 700],
  'cormorant-garamond': [300, 400, 500, 600, 700],
  'eb-garamond': [400, 500, 600, 700, 800],
  'libre-baskerville': [400, 700],
  'merriweather': [300, 400, 700, 900],
  'lora': [400, 500, 600, 700],
  'raleway': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'montserrat': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'poppins': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'inter': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'nunito': [200, 300, 400, 500, 600, 700, 800, 900],
  'oswald': [200, 300, 400, 500, 600, 700],
  'bebas-neue': [400],
  'abril-fatface': [400],
  'pacifico': [400],
  'sacramento': [400],
  'allura': [400],
  'alex-brush': [400],
  'pinyon-script': [400],
  'satisfy': [400],
  'tangerine': [400],
  'italiana': [400],
  'uncial-antiqua': [400],
  'medievalsharp': [400],
  'almendra': [400, 700],
  'metamorphous': [400],
  'philosopher': [400, 700]
};

function getClosestWeight(slug: string, requested: number): number {
  const available = FONT_WEIGHTS_MAP[slug] || [400];
  return available.reduce((prev, curr) => {
    return Math.abs(curr - requested) < Math.abs(prev - requested) ? curr : prev;
  });
}

export async function fetchFont(fontName: string, weight = 400, style = 'normal'): Promise<ArrayBuffer> {
  const slug = fontNameToSlug(fontName);
  const resolvedWeight = getClosestWeight(slug, weight);

  const cacheKey = `${fontName}-${resolvedWeight}-${style}`;
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!;
  }

  const url = buildFontsourceUrl(slug, resolvedWeight, style);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Font fetch failed (${response.status}): ${url}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error(`Empty font file: ${url}`);
    }

    fontCache.set(cacheKey, buffer);
    return buffer;
  } catch (error) {
    console.error(`Error loading font "${fontName}" (weight ${weight} resolved to ${resolvedWeight}, style ${style}):`, error);
    throw error;
  }
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
