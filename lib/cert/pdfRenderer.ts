'use client';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
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

export async function renderPdfPage(
  file: File,
  pageNumber: number = 1,
  scale: number = 1.5
): Promise<PdfRenderResult> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  
  // Conform to pdfjs v4 which requires canvas parameter
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  
  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png'),
    pageCount: pdf.numPages,
    width: viewport.width,
    height: viewport.height,
  };
}
