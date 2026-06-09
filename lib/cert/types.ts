export interface TextShadow {
  x: number;
  y: number;
  blur: number;
  color: string;
}

export interface CertField {
  id: string;
  label: string;              // e.g., "Name", "School", custom
  dataColumn: string | null;  // mapped column from CSV/Excel
  x: number;                  // position in PDF points
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  coordSpace?: 'pdf-points' | 'legacy';
  underline: boolean;
  strikethrough: boolean;
  color: string;              // hex
  opacity: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom';
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textShadow: TextShadow | null;
  zIndex: number;
  locked: boolean;
  pageIndex: number;
}

export interface CertRow {
  id: string;
  data: Record<string, string>;  // column → value
  status: 'pending' | 'approved' | 'edited' | 'skipped' | 'deleted';
  outputBlob: Blob | null;
  editedBlob: Blob | null;
}

export interface CertProject {
  templateFile: File | null;
  templatePdfBytes: ArrayBuffer | null;
  fields: CertField[];
  rows: CertRow[];
  exportFormat: 'pdf' | 'png' | 'both';
  pngDpi: 150 | 300 | 600;
  fileNamePattern: string;
  globalFont: string | null;
  globalColor: string | null;
  globalFontScale: number;
  dateFormat: string;
  textEncoding: 'utf-8' | 'ascii';
  pdfCompression: 'none' | 'low' | 'high';
  pageSizeOverride: 'match' | 'a4' | 'letter' | 'custom';
  customPageWidth?: number; // mm
  customPageHeight?: number; // mm
}

export interface CertLog {
  id: string;
  date: string;
  facultyName: string;
  templateName: string;
  count: number;
  format: string;
}
