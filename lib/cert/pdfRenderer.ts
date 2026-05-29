import * as pdfjs from 'pdfjs-dist';

// Ensure worker is configured at runtime client-side
if (typeof window !== 'undefined') {
  // Use official CDN version matching standard installed pdfjs-dist major versions
  const version = pdfjs.version || '4.0.37';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
}

export interface RenderedPageInfo {
  canvasDataUrl: string;
  width: number; // in pt
  height: number; // in pt
  pageCount: number;
}

export async function renderPdfPage(pdfBytes: ArrayBuffer, pageIndex = 1): Promise<RenderedPageInfo> {
  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  
  // pageIndex is 1-indexed in pdfjs
  const page = await pdf.getPage(pageIndex);
  
  // Standard scale = 1.5 for high resolution rendering
  const viewport = page.getViewport({ scale: 1.5 });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not create 2D canvas context');
  }
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvas: canvas
  };
  
  await page.render(renderContext).promise;
  
  // Get data URL
  const canvasDataUrl = canvas.toDataURL('image/png');
  
  return {
    canvasDataUrl,
    width: page.view[2] - page.view[0], // Page width in pt
    height: page.view[3] - page.view[1], // Page height in pt
    pageCount: pdf.numPages
  };
}

export async function getPdfPageCount(pdfBytes: ArrayBuffer): Promise<number> {
  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  return pdf.numPages;
}
