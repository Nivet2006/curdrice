import { CertProject, CertField, CertRow } from './types';

export const INITIAL_PROJECT_STATE: CertProject = {
  templateFile: null,
  templatePdfBytes: null,
  fields: [],
  rows: [],
  exportFormat: 'pdf',
  pngDpi: 300,
  fileNamePattern: '{Name}_Certificate',
  globalFont: null,
  globalColor: null,
  globalFontScale: 1.0,
  dateFormat: 'DD/MM/YYYY',
  textEncoding: 'utf-8',
  pdfCompression: 'none',
  pageSizeOverride: 'match',
};

// History state container
export interface HistoryState {
  fields: CertField[];
}

export class HistoryManager {
  private past: HistoryState[] = [];
  private future: HistoryState[] = [];
  private maxHistory = 50;

  push(fields: CertField[]) {
    // Deep clone fields to prevent reference issues
    const stateCopy = JSON.parse(JSON.stringify(fields));
    
    if (this.past.length > 0) {
      const lastState = this.past[this.past.length - 1];
      if (JSON.stringify(lastState.fields) === JSON.stringify(stateCopy)) {
        return; // No change, skip
      }
    }
    
    this.past.push({ fields: stateCopy });
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
    this.future = []; // Clear redo stack on new action
  }

  undo(currentFields: CertField[]): { fields: CertField[]; hasChanged: boolean } {
    if (this.past.length === 0) return { fields: currentFields, hasChanged: false };
    
    const previous = this.past.pop()!;
    this.future.push({ fields: JSON.parse(JSON.stringify(currentFields)) });
    
    return { fields: previous.fields, hasChanged: true };
  }

  redo(currentFields: CertField[]): { fields: CertField[]; hasChanged: boolean } {
    if (this.future.length === 0) return { fields: currentFields, hasChanged: false };
    
    const next = this.future.pop()!;
    this.past.push({ fields: JSON.parse(JSON.stringify(currentFields)) });
    
    return { fields: next.fields, hasChanged: true };
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear() {
    this.past = [];
    this.future = [];
  }
}

export const history = new HistoryManager();
