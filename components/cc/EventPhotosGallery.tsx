'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Trash2, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

interface Photo {
  id: string;
  url: string;
  created_at: string;
  uploaded_by: string;
}

export function EventPhotosGallery({ eventId }: { eventId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch photos on load
  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Failed to fetch event gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [eventId]);

  // Handle file compress and upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Compress client-side
        const compressedBlob = await new Promise<Blob>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
              }
              const MAX_DIM = 1200;
              let width = img.width;
              let height = img.height;
              if (width > height) {
                if (width > MAX_DIM) {
                  height = Math.round((height * MAX_DIM) / width);
                  width = MAX_DIM;
                }
              } else {
                if (height > MAX_DIM) {
                  width = Math.round((width * MAX_DIM) / height);
                  height = MAX_DIM;
                }
              }
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error('Empty blob'))),
                'image/jpeg',
                0.75
              );
            };
          };
        });

        const formData = new FormData();
        formData.append('file', compressedBlob, 'gallery.jpg');

        const response = await fetch(`/api/events/${eventId}/photos`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          successCount++;
        }
      } catch (err: any) {
        console.error('Failed to upload image:', err);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} photo(s) to gallery.`);
      fetchPhotos();
    } else {
      toast.error('Failed to upload photos.');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Delete photo
  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/events/${eventId}/photos?photoId=${photoId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Photo deleted.');
        setPhotos(prev => prev.filter(p => p.id !== photoId));
      } else {
        toast.error('Failed to delete photo.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting photo.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border border-zinc-200 dark:border-zinc-850">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-black dark:text-white flex items-center gap-2">
            <ImageIcon size={18} className="opacity-60" />
            Event Media Gallery
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Upload photos of the event. These can be easily affixed to reports later.</p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all text-xs font-bold font-mono rounded-xl disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={14} />
              Add Photos
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {photos.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/20"
        >
          <Upload size={24} className="text-zinc-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">No Photos Uploaded Yet</span>
          <span className="text-[10px] font-mono text-zinc-400">Click here to batch upload images (JPEG/PNG)</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div 
              key={photo.id} 
              className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group shadow-sm bg-zinc-100 dark:bg-zinc-950/40"
            >
              <img 
                src={photo.url} 
                alt="Event gallery item" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setEnlargedPhoto(photo.url)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Enlarge"
                >
                  <Maximize2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Photo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enlarged Photo Modal */}
      {enlargedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setEnlargedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>
            <img 
              src={enlargedPhoto} 
              alt="Enlarged" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
