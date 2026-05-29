import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { CertField, CertRow } from './types';
import { fetchFont } from './fontLoader';

// Helper to convert hex color to normalized pdf-lib rgb values
function hexToColor(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

// Transforms text based on field options
export function transformText(text: string, transform: CertField['textTransform']) {
  if (!text) return '';
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, c => c.toUpperCase());
    default:
      return text;
  }
}

interface GenerateSingleCertOptions {
  pdfBytes: ArrayBuffer;
  fields: CertField[];
  rowData: Record<string, string>;
  globalFont?: string | null;
  globalColor?: string | null;
  globalFontScale?: number;
}

export async function generateSingleCertificate({
  pdfBytes,
  fields,
  rowData,
  globalFont,
  globalColor,
  globalFontScale = 1.0
}: GenerateSingleCertOptions): Promise<Blob> {
  // Load existing PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // Cache for loaded embedded fonts to prevent duplicate embedding in same doc
  const loadedFonts: Record<string, any> = {};

  for (const field of fields) {
    if (field.pageIndex < 0 || field.pageIndex >= pages.length) continue;
    const page = pages[field.pageIndex];
    const { width: pageDocWidth, height: pageDocHeight } = page.getSize();

    // Map content from data columns or fallback
    let text = field.dataColumn && rowData[field.dataColumn] !== undefined
      ? rowData[field.dataColumn]
      : `[${field.label}]`;

    if (!text && field.label) {
      text = `[${field.label}]`;
    }

    text = transformText(text, field.textTransform);

    // Font configuration (Step 2 individual preference or Step 4 global overrides)
    const activeFontFamily = globalFont || field.fontFamily || 'Inter';
    const activeColor = globalColor || field.color || '#000000';
    const activeFontSize = (field.fontSize || 14) * globalFontScale;

    // Load and embed font TTF via our fontLoader
    let embeddedFont;
    const fontKey = `${activeFontFamily}-${field.fontWeight || 400}`;
    if (loadedFonts[fontKey]) {
      embeddedFont = loadedFonts[fontKey];
    } else {
      try {
        const fontBuffer = await fetchFont(activeFontFamily, field.fontWeight || 400);
        embeddedFont = await pdfDoc.embedFont(fontBuffer);
        loadedFonts[fontKey] = embeddedFont;
      } catch (err) {
        console.warn(`Could not embed custom font "${activeFontFamily}". Falling back to Helvetica.`, err);
      }
    }

    // Convert coordinates:
    // Web: y is distance from top border of canvas
    // PDF: y is distance from bottom border of canvas
    // So pdfY = pageDocHeight - fieldY - fieldHeight
    // For precise alignment, we also factor vertical alignment or letter spacings later if needed.
    const pdfY = pageDocHeight - field.y - field.height;

    // Draw the text
    page.drawText(text, {
      x: field.x,
      y: pdfY + (field.height - activeFontSize) / 2, // Centered vertically in field box by default
      size: activeFontSize,
      font: embeddedFont,
      color: hexToColor(activeColor),
      opacity: field.opacity / 100,
      rotate: degrees(field.rotation),
    });
  }

  const outputBytes = await pdfDoc.save();
  return new Blob([outputBytes as any], { type: 'application/pdf' });
}
