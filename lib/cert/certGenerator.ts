import { PDFDocument, rgb, degrees, StandardFonts, PDFFont } from 'pdf-lib';
import { CertField } from './types';
import { fetchFont } from './fontLoader';
import fontkit from '@pdf-lib/fontkit';

function hexToColor(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

export function transformText(text: string, transform: CertField['textTransform']) {
  if (!text) return '';
  switch (transform) {
    case 'uppercase': return text.toUpperCase();
    case 'lowercase': return text.toLowerCase();
    case 'capitalize': return text.replace(/\b\w/g, c => c.toUpperCase());
    default: return text;
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

function detectLegacyCoordScale(
  fields: CertField[],
  pageWidth: number,
  pageHeight: number
): number {
  if (fields.length === 0) return 1;
  const maxX = Math.max(...fields.map(f => f.x + f.width));
  const maxY = Math.max(...fields.map(f => f.y + f.height));
  if (maxX > pageWidth * 1.05 || maxY > pageHeight * 1.05) return 1 / 1.5;
  return 1;
}

interface GenerateSingleCertOptions {
  pdfBytes: ArrayBuffer;
  fields: CertField[];
  rowData: Record<string, string>;
  globalFont?: string | null;
  globalColor?: string | null;
  globalFontScale?: number;
  dateFormat?: string;
}

export async function generateSingleCertificate({
  pdfBytes,
  fields,
  rowData,
  globalFont,
  globalColor,
  globalFontScale = 1.0,
  dateFormat = 'DD/MM/YYYY',
}: GenerateSingleCertOptions): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);
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

    // ── Resolve display text ──────────────────────────────────────────────────
    let text = '';
    if (scaledField.dataColumn) {
      text =
        rowData[scaledField.dataColumn] !== undefined
          ? rowData[scaledField.dataColumn]
          : scaledField.dataColumn;
    } else {
      text = `[${scaledField.label}]`;
    }

    // ── Date formatting ───────────────────────────────────────────────────────
    if (
      text &&
      (scaledField.label.toLowerCase().includes('date') ||
        scaledField.dataColumn?.toLowerCase().includes('date'))
    ) {
      const parsedDate = new Date(text);
      if (!isNaN(parsedDate.getTime())) {
        const day   = String(parsedDate.getDate()).padStart(2, '0');
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const year  = String(parsedDate.getFullYear());
        text = dateFormat
          .replace('YYYY', year)
          .replace('YY', year.substring(2))
          .replace('MM', month)
          .replace('DD', day);
      }
    }

    text = transformText(text, scaledField.textTransform);

    // ── Font / style resolution ───────────────────────────────────────────────
    const activeFontFamily = globalFont  || scaledField.fontFamily  || 'Inter';
    const activeColor      = globalColor || scaledField.color       || '#000000';
    const activeFontSize   = (scaledField.fontSize || 14) * globalFontScale;
    const activeFontStyle  = scaledField.fontStyle || 'normal';
    const fontKey = `${activeFontFamily}-${scaledField.fontWeight || 400}-${activeFontStyle}`;

    let embeddedFont = loadedFonts[fontKey];
    if (!embeddedFont) {
      try {
        const fontBuffer = await fetchFont(
          activeFontFamily,
          scaledField.fontWeight || 400,
          activeFontStyle
        );
        embeddedFont = await pdfDoc.embedFont(fontBuffer);
        loadedFonts[fontKey] = embeddedFont;
      } catch (err) {
        console.warn(
          `Could not embed font "${activeFontFamily}". Falling back to Helvetica.`,
          err
        );
        embeddedFont = fallbackFont;
      }
    }

    // ── Multi-line layout ─────────────────────────────────────────────────────
    const lines = text.split('\n');
    const lh = scaledField.lineHeight || 1.2;
    const lineSlotHeight = activeFontSize * lh;   // vertical space allocated per line
    const totalBlockHeight = lines.length * lineSlotHeight;

    // ── FIXED: Get real ascent/descent from font embedder ─────────────────────
    const fontAny  = embeddedFont as any;
    const embedder = fontAny.embedder;
    let ascent  =  activeFontSize * 0.8;   // safe defaults
    let descent = -activeFontSize * 0.2;

    if (embedder?.font) {
      const scale = embedder.scale ?? 1;
      if (embedder.font.ascent !== undefined) {
        ascent  = (embedder.font.ascent  * scale / 1000) * activeFontSize;
        descent = (embedder.font.descent * scale / 1000) * activeFontSize;
      } else if (embedder.font.Ascender !== undefined) {
        ascent  = (embedder.font.Ascender  / 1000) * activeFontSize;
        descent = (embedder.font.Descender / 1000) * activeFontSize;
      }
    }

    // capHeight gives a tighter "visual" top — use it when available
    let capHeight = ascent; // fallback
    if (embedder?.font?.capHeight !== undefined) {
      const scale = embedder.scale ?? 1;
      capHeight = (embedder.font.capHeight * scale / 1000) * activeFontSize;
    }

    // ── Vertical block alignment inside the field box ─────────────────────────
    // We work in "distance from box top" (screen / canvas convention).
    // blockTopFromBoxTop = distance from top of field box to top of first line slot.
    let blockTopFromBoxTop: number;
    switch (scaledField.verticalAlign) {
      case 'top':
        blockTopFromBoxTop = 0;
        break;
      case 'bottom':
        blockTopFromBoxTop = scaledField.height - totalBlockHeight;
        break;
      default: // 'middle'
        blockTopFromBoxTop = (scaledField.height - totalBlockHeight) / 2;
    }

    // ── Rotation pivot (center of field box in PDF coords) ────────────────────
    const rad = (scaledField.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const cx = scaledField.x + scaledField.width  / 2;
    const cy = pageDocHeight - (scaledField.y + scaledField.height / 2);

    // ── Draw each line ────────────────────────────────────────────────────────
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const textWidth = embeddedFont.widthOfTextAtSize(line, activeFontSize);

      // ── Horizontal alignment ──────────────────────────────────────────────
      let tx = scaledField.x; // left (default)
      if (scaledField.textAlign === 'center') {
        tx = scaledField.x + (scaledField.width - textWidth) / 2;
      } else if (scaledField.textAlign === 'right') {
        tx = scaledField.x + scaledField.width - textWidth;
      }

      // ── FIXED: Baseline Y calculation ─────────────────────────────────────
      //
      // Goal: the *visual* glyph body should sit centered in its line slot.
      //
      // In canvas/screen space (y increases downward):
      //   lineSlotTop  = fieldTop + blockTopFromBoxTop + i * lineSlotHeight
      //   lineSlotMid  = lineSlotTop + lineSlotHeight / 2
      //
      // The PDF baseline sits ABOVE the visual center of the glyph by:
      //   (ascent - capHeight/2) approximately, but simplest correct formula:
      //   baseline = lineSlotMid + (ascent - (ascent - descent) / 2)
      //            = lineSlotMid + (ascent + descent) / 2
      //
      // Then convert canvas-y → PDF-y (flip):
      //   pdfY = pageDocHeight - canvasY
      //
      const lineSlotTopCanvas =
        scaledField.y + blockTopFromBoxTop + i * lineSlotHeight;

      const lineSlotMidCanvas = lineSlotTopCanvas + lineSlotHeight / 2;

      // Baseline is above visual center by half the font's total em height offset
      // (ascent is positive, descent is negative)
      const baselineCanvas =
        lineSlotMidCanvas - (ascent + descent) / 2;

      const ty = pageDocHeight - baselineCanvas;

      // ── Apply rotation around field center ────────────────────────────────
      const dx = tx - cx;
      const dy = ty - cy;

      const textX = cx + dx * cos - dy * sin;
      const textY = cy + dx * sin + dy * cos;

      page.drawText(line, {
        x: textX,
        y: textY,
        size: activeFontSize,
        font: embeddedFont,
        color: hexToColor(activeColor),
        opacity: scaledField.opacity / 100,
        rotate: degrees(scaledField.rotation),
      });
    }
  }

  const outputBytes = await pdfDoc.save();
  return new Blob([outputBytes as BlobPart], { type: 'application/pdf' });
}
