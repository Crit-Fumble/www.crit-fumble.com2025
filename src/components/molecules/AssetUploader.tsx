'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UploadedAsset {
  id: string
  name: string
  url: string
  assetType: string
  fileSize: number
  width?: number
  height?: number
}

interface UploadLimits {
  maxFileSize: number
  maxFileSizeLabel: string
  isOwner: boolean
}

export function AssetUploader() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<UploadedAsset | null>(null)
  const [limits, setLimits] = useState<UploadLimits>({
    maxFileSize: 50 * 1024 * 1024, // Default to 50MB
    maxFileSizeLabel: '50MB',
    isOwner: false,
  })

  // Fetch upload limits on mount
  useEffect(() => {
    async function fetchLimits() {
      try {
        const response = await fetch('/api/assets/upload')
        if (response.ok) {
          const data = await response.json()
          setLimits({
            maxFileSize: data.maxFileSize,
            maxFileSizeLabel: data.maxFileSizeLabel,
            isOwner: data.isOwner,
          })
        }
      } catch {
        // Use defaults on error
      }
    }
    fetchLimits()
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limits.maxFileSize])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limits.maxFileSize])

  const uploadFile = async (file: File) => {
    setError(null)
    setSuccess(null)

    // Client-side file size validation
    if (file.size > limits.maxFileSize) {
      setError(`File too large. Maximum size is ${limits.maxFileSizeLabel}`)
      return
    }

    setIsUploading(true)
    setUploadProgress('Preparing upload...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name.replace(/\.[^.]+$/, ''))

      setUploadProgress('Uploading...')

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setSuccess(result.asset)
      setUploadProgress(null)

      // Refresh the page to show the new asset
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(null)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Asset</h2>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging
            ? 'border-crit-purple-500 bg-crit-purple-50 dark:bg-crit-purple-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-crit-purple-400 dark:hover:border-crit-purple-500'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.md,.txt,.rtf"
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto border-4 border-crit-purple-200 border-t-crit-purple-600 rounded-full animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">{uploadProgress}</p>
          </div>
        ) : (
          <>
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-semibold text-crit-purple-600 dark:text-crit-purple-400">Click to upload</span>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Images: PNG, JPG, WebP | Documents: PDF, DOC, DOCX, MD, TXT, RTF
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Max file size: {limits.maxFileSizeLabel}
              {limits.isOwner && (
                <span className="ml-1 text-crit-purple-500">(Owner limit)</span>
              )}
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-green-700 dark:text-green-400 font-medium">
                Uploaded: {success.name}
              </p>
              <p className="text-green-600 dark:text-green-500 text-sm">
                {success.assetType} | {(success.fileSize / 1024).toFixed(1)} KB
                {success.width && success.height && ` | ${success.width} x ${success.height}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Note */}
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
        Images are automatically converted to WebP format for optimal performance.
      </p>
    </div>
  )
}
