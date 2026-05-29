import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsvFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        resolve({ headers, rows });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export function parseExcelFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Failed to read file contents');
        }
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse worksheet as JSON with header rows
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const headers = jsonData[0].map(h => String(h || '').trim());
        const rows: Record<string, string>[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const rowValues = jsonData[i];
          const rowObj: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            if (header) {
              rowObj[header] = rowValues[index] !== undefined && rowValues[index] !== null
                ? String(rowValues[index]).trim()
                : '';
            }
          });
          
          rows.push(rowObj);
        }

        resolve({ headers, rows });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}
