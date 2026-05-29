// Google Font TTF Loader and Cache
// Fetches the TTF buffer via standard HTTP, using Google Fonts CSS2 API to extract the direct .ttf URL.

export const AVAILABLE_FONTS = [
  'Playfair Display', 'Cinzel', 'Great Vibes', 'Dancing Script', 'Cormorant Garamond',
  'EB Garamond', 'Libre Baskerville', 'Merriweather', 'Lora', 'Raleway',
  'Montserrat', 'Poppins', 'Inter', 'Nunito', 'Oswald', 'Bebas Neue',
  'Abril Fatface', 'Pacifico', 'Sacramento', 'Allura', 'Alex Brush',
  'Pinyon Script', 'Satisfy', 'Tangerine', 'Italiana', 'Uncial Antiqua',
  'MedievalSharp', 'Almendra', 'Metamorphous', 'Philosopher'
];

const fontCache = new Map<string, ArrayBuffer>();

export async function fetchFont(fontName: string, weight = 400): Promise<ArrayBuffer> {
  const cacheKey = `${fontName}-${weight}`;
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!;
  }

  try {
    // 1. Request CSS from Google Fonts API
    const formattedName = fontName.replace(/\s+/g, '+');
    const cssUrl = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@${weight}&display=swap`;
    
    const cssResponse = await fetch(cssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });
    
    if (!cssResponse.ok) {
      throw new Error(`Google CSS fetch failed: ${cssResponse.statusText}`);
    }
    
    const cssText = await cssResponse.text();
    
    // 2. Extract .ttf direct link
    const match = cssText.match(/url\((https:\/\/[^)]+\.ttf)\)/);
    if (!match || !match[1]) {
      throw new Error(`Failed to find .ttf URL in Google CSS for font ${fontName}`);
    }
    
    const ttfUrl = match[1];
    
    // 3. Fetch the actual ArrayBuffer of the TTF
    const ttfResponse = await fetch(ttfUrl);
    if (!ttfResponse.ok) {
      throw new Error(`TTF file fetch failed: ${ttfResponse.statusText}`);
    }
    
    const buffer = await ttfResponse.arrayBuffer();
    fontCache.set(cacheKey, buffer);
    return buffer;
  } catch (error) {
    console.error(`Error loading font "${fontName}":`, error);
    // Fallback: we return a simple mock empty buffer or throw error
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
