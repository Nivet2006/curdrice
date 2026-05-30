import { PDFDocument, rgb, degrees, StandardFonts, PDFFont } from 'pdf-lib';
import { CertField } from './types';
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

function computeTextX(
  field: CertField,
  text: string,
  font: PDFFont,
  fontSize: number
): number {
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  switch (field.textAlign) {
    case 'center':
      return field.x + (field.width - textWidth) / 2;
    case 'right':
      return field.x + field.width - textWidth;
    default:
      return field.x;
  }
}

function computeTextY(
  field: CertField,
  pageHeight: number,
  fontSize: number
): number {
  // field.y is distance from top; PDF y is baseline distance from bottom
  const boxBottom = pageHeight - field.y - field.height;
  switch (field.verticalAlign) {
    case 'top':
      return boxBottom + field.height - fontSize;
    case 'bottom':
      return boxBottom;
    default:
      return boxBottom + (field.height - fontSize) / 2;
  }
}

function scaleFieldForLegacyCoords(field: CertField, scale: number): CertField {
  if (scale === 1) return field;
  return {
    ...field,
    x: field.x * scale,
    y: field.y * scale,
    width: field.width * scale,
    height: field.height * scale,
    fontSize: field.fontSize * scale,
  };
}

/** Detect fields saved in canvas-pixel space (pdf.js render scale 1.5) vs PDF points. */
function detectLegacyCoordScale(fields: CertField[], pageWidth: number, pageHeight: number): number {
  if (fields.length === 0) return 1;
  const maxX = Math.max(...fields.map(f => f.x + f.width));
  const maxY = Math.max(...fields.map(f => f.y + f.height));
  if (maxX > pageWidth * 1.05 || maxY > pageHeight * 1.05) {
    return 1 / 1.5;
  }
  return 1;
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
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const firstPageSize = pages[0]?.getSize();
  const legacyCoordScale = firstPageSize
    ? detectLegacyCoordScale(fields, firstPageSize.width, firstPageSize.height)
    : 1;

  const fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const loadedFonts: Record<string, PDFFont> = {};

  for (const field of fields) {
    if (field.pageIndex < 0 || field.pageIndex >= pages.length) continue;
    const page = pages[field.pageIndex];
    const { height: pageDocHeight } = page.getSize();
    const scaledField = scaleFieldForLegacyCoords(field, legacyCoordScale);

    let text = scaledField.dataColumn && rowData[scaledField.dataColumn] !== undefined
      ? rowData[scaledField.dataColumn]
      : `[${scaledField.label}]`;

    if (!text && scaledField.label) {
      text = `[${scaledField.label}]`;
    }

    text = transformText(text, scaledField.textTransform);

    const activeFontFamily = globalFont || scaledField.fontFamily || 'Inter';
    const activeColor = globalColor || scaledField.color || '#000000';
    const activeFontSize = (scaledField.fontSize || 14) * globalFontScale;
    const activeFontStyle = scaledField.fontStyle || 'normal';
    const fontKey = `${activeFontFamily}-${scaledField.fontWeight || 400}-${activeFontStyle}`;

    let embeddedFont = loadedFonts[fontKey];
    if (!embeddedFont) {
      try {
        const fontBuffer = await fetchFont(activeFontFamily, scaledField.fontWeight || 400, activeFontStyle);
        embeddedFont = await pdfDoc.embedFont(fontBuffer);
        loadedFonts[fontKey] = embeddedFont;
      } catch (err) {
        console.warn(`Could not embed custom font "${activeFontFamily}". Falling back to Helvetica.`, err);
        embeddedFont = fallbackFont;
      }
    }

    const textX = computeTextX(scaledField, text, embeddedFont, activeFontSize);
    const textY = computeTextY(scaledField, pageDocHeight, activeFontSize);

    page.drawText(text, {
      x: textX,
      y: textY,
      size: activeFontSize,
      font: embeddedFont,
      color: hexToColor(activeColor),
      opacity: scaledField.opacity / 100,
      rotate: degrees(scaledField.rotation),
    });
  }

  const outputBytes = await pdfDoc.save();
  return new Blob([outputBytes as BlobPart], { type: 'application/pdf' });
}
