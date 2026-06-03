'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'

type ImageUploadInputProps = {
  label?: string
  name: string
  defaultValue?: string
  required?: boolean
  className?: string
  onChange?: (url: string) => void
}

export function ImageUploadInput({
  label,
  name,
  defaultValue = '',
  required = false,
  className = '',
  onChange
}: ImageUploadInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(defaultValue)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const compressAndUpload = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      // 1. Create a promise to handle client-side canvas compression
      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
          const img = new Image()
          img.src = event.target?.result as string
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('Canvas context not available'))
              return
            }

            // Cap dimensions at 1200px max width/height
            const MAX_DIM = 1200
            let width = img.width
            let height = img.height

            if (width > height) {
              if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width)
                width = MAX_DIM
              }
            } else {
              if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height)
                height = MAX_DIM
              }
            }

            canvas.width = width
            canvas.height = height

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height)

            // Compress to JPEG at 70% quality
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob)
                } else {
                  reject(new Error('Compression output is empty'))
                }
              },
              'image/jpeg',
              0.7
            )
          }
          img.onerror = () => reject(new Error('Failed to load image object'))
        }
        reader.onerror = () => reject(new Error('Failed to read file reader'))
      })

      // 2. Upload to Backblaze via proxy API
      const formData = new FormData()
      formData.append('file', compressedBlob, 'upload.jpg')

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Upload failed')
      }

      const data = await response.json()
      setPreviewUrl(data.url)
      onChange?.(data.url)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to compress and upload image.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      compressAndUpload(file)
    }
  }

  const handleClear = () => {
    setPreviewUrl('')
    onChange?.('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-mono text-[#555555] dark:text-zinc-400 uppercase tracking-widest font-black">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Hidden input to pass value in form submission */}
      <input type="hidden" name={name} value={previewUrl} required={required && !previewUrl} />

      <div className="relative group border border-[#d0d0d0] dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
        {previewUrl ? (
          <div className="relative w-full h-40 bg-zinc-100 dark:bg-zinc-950">
            <img src={previewUrl} alt="Branding Poster" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-950/40 transition-colors"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-zinc-500 font-mono text-[10px] uppercase tracking-widest font-bold">
                <Loader2 className="animate-spin text-black dark:text-white" size={24} />
                Compressing & Uploading...
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                  <Upload size={18} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Choose or Drag Image</p>
                  <p className="text-[10px] font-mono text-zinc-400">Supported formats: JPEG, PNG</p>
                </div>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {error && (
        <p className="text-[10px] font-mono text-rose-500 uppercase tracking-widest font-bold">{error}</p>
      )}
    </div>
  )
}
