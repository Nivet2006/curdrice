interface SaveItem {
  name: string;
  blob: Blob;
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function saveFilesToLocalDirectory(items: SaveItem[]): Promise<number> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser.');
  }

  // Request directory permission
  const dirHandle = await (window as any).showDirectoryPicker();
  let savedCount = 0;

  const nameCounts: Record<string, number> = {};

  for (const item of items) {
    let finalName = item.name;
    
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

    try {
      // Create file in the picked directory
      const fileHandle = await dirHandle.getFileHandle(finalName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(item.blob);
      await writable.close();
      savedCount++;
    } catch (err) {
      console.error(`Failed to save file "${finalName}" to directory`, err);
    }
  }

  return savedCount;
}
