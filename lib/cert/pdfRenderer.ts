'use client';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  const pdfjs = await import('pdfjs-dist');
  const version = pdfjs.version ?? '5.7.284';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
  pdfjsLib = pdfjs;
  return pdfjs;
}

export interface PdfRenderResult {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  pageCount: number;
  width: number;
  height: number;
}

export async function renderPdfPageFromBytes(
  bytes: ArrayBuffer,
  pageNumber: number = 1,
  scale: number = 1.5
): Promise<PdfRenderResult> {
  if (typeof window === 'undefined') {
    throw new Error('renderPdfPageFromBytes must be called client-side only');
  }
  const pdfjs = await getPdfjs();
  
  // Defensive copy — prevents detachment errors
  const safeBytes = bytes.byteLength > 0 ? bytes.slice(0) : (() => { throw new Error('Empty ArrayBuffer — file may not have loaded correctly'); })();
  
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(safeBytes) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    pdf.destroy();
    throw new Error('Could not get 2D canvas context');
  }
  
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const dataUrl = canvas.toDataURL('image/png');
  
  // Clean up to free memory
  pdf.destroy();
  
  return {
    canvas,
    dataUrl,
    pageCount: pdf.numPages,
    width: canvas.width,
    height: canvas.height,
  };
}

// Keep old signature for backward compat
export async function renderPdfPage(
  file: File,
  pageNumber: number = 1,
  scale: number = 1.5
): Promise<PdfRenderResult> {
  const bytes = await file.arrayBuffer();
  return renderPdfPageFromBytes(bytes.slice(0), pageNumber, scale);
}
