import { Document, Packer, Paragraph, ImageRun } from 'docx';

export async function convertPdfToDocx(pdfUrl: string, outputFileName: string) {
  try {
    const pdfjs = await import('pdfjs-dist');
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error(`Failed to fetch PDF from ${pdfUrl}`);
    const pdfData = await response.arrayBuffer();

    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    const sections = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      
      // Render at a high viewport scale (2.0) to ensure high-fidelity image output
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create 2D canvas context');

      // Render PDF page to canvas context
      await page.render({
        canvasContext: context,
        viewport: viewport
      } as any).promise;

      // Extract image as high-quality JPEG to keep file size reasonable
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
      });

      const arrayBuffer = await blob.arrayBuffer();

      // Convert page size to dxa (1 point = 20 dxa)
      const pageRealWidthPt = viewport.width / scale;
      const pageRealHeightPt = viewport.height / scale;

      const widthDxa = Math.round(pageRealWidthPt * 20);
      const heightDxa = Math.round(pageRealHeightPt * 20);

      sections.push({
        properties: {
          page: {
            size: {
              width: widthDxa,
              height: heightDxa,
            },
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
          },
        },
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: arrayBuffer,
                transformation: {
                  width: pageRealWidthPt,
                  height: pageRealHeightPt,
                },
              } as any),
            ],
          }),
        ],
      });
    }

    const doc = new Document({
      sections: sections
    });

    const docxBlob = await Packer.toBlob(doc);
    
    // Initiate browser download
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error in convertPdfToDocx:', error);
    throw error;
  }
}
