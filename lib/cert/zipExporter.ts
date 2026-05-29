import JSZip from 'jszip';

interface ZipFileItem {
  name: string;
  blob: Blob;
}

export async function downloadZipBundle(files: ZipFileItem[], zipFileName = 'certificates.zip'): Promise<void> {
  const zip = new JSZip();

  // Keep track of counts to prevent filename collisions
  const nameCounts: Record<string, number> = {};

  files.forEach((file) => {
    let finalName = file.name;
    
    // De-duplicate name collisions
    if (nameCounts[finalName] !== undefined) {
      nameCounts[finalName]++;
      const dotIndex = finalName.lastIndexOf('.');
      if (dotIndex !== -1) {
        finalName = `${finalName.substring(0, dotIndex)} (${nameCounts[finalName]})${finalName.substring(dotIndex)}`;
      } else {
        finalName = `${finalName} (${nameCounts[finalName]})`;
      }
    } else {
      nameCounts[finalName] = 0;
    }

    zip.file(finalName, file.blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

// Generate filename based on pattern (e.g. "{name}_{roll}_{date}")
export function resolveFileName(
  pattern: string,
  rowData: Record<string, string>,
  index: number,
  extension = 'pdf'
): string {
  let fileName = pattern;

  // Find all tokens like {column_name} and replace them
  const tokenRegex = /\{([^}]+)\}/g;
  let match;
  
  while ((match = tokenRegex.exec(pattern)) !== null) {
    const token = match[1];
    const value = rowData[token] || '';
    fileName = fileName.replace(`{${token}}`, value);
  }

  // Remove any characters invalid for filesystems
  fileName = fileName.replace(/[\\\/:\*\?"<>\|]/g, '_');
  
  // If result is empty, fallback to simple index name
  if (!fileName || fileName.trim() === '') {
    fileName = `certificate_${index + 1}`;
  }

  return `${fileName}.${extension}`;
}
