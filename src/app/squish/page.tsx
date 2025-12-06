/* eslint-disable no-unused-vars */
'use client'

import JSZip from 'jszip'
import {
  Upload,
  Trash2,
  Download,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  FileArchive,
  Eye,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useCallback, useMemo } from 'react'
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { useImageQueue } from '@/hooks/useImageQueue'
import {
  DEFAULT_QUALITY_SETTINGS,
  downloadImage,
  formatFileSize,
  cn,
  sampleImages,
} from '@/lib'
import logger from '@/lib/logger'
import type {
  ImageFile,
  OutputType,
  CompressionOptions as CompressionOptionsType,
} from '@/types'

// Common button styles
const buttonStyles = {
  base: 'rounded-lg px-4 py-2 transition-all duration-300 shadow-sm focus:ring-2 focus:ring-offset-1 cursor-pointer text-sm sm:text-base',
  download:
    'bg-gradient-to-r from-green-500/80 to-teal-500/80 text-white hover:from-green-600 hover:to-teal-600 focus:ring-green-400',
  downloadZip:
    'bg-gradient-to-r from-purple-500/80 to-indigo-500/80 text-white hover:from-purple-600 hover:to-indigo-600 focus:ring-purple-400',
  clear:
    'bg-gradient-to-r from-red-500/80 to-orange-500/80 text-white hover:from-red-600 hover:to-orange-600 focus:ring-red-400',
  format:
    'bg-[#1a1b2e]/40 text-foreground/80 hover:bg-blue-500/20 hover:text-blue-400 border border-border/30',
  formatActive:
    'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm',
}

// Compression Options Component
const CompressionOptions = ({
  outputType,
  options,
  onOutputTypeChange,
  onQualityChange,
}: {
  outputType: OutputType
  options: CompressionOptionsType
  onOutputTypeChange: (type: OutputType) => void
  onQualityChange: (value: number) => void
}) => (
  <div className="space-y-4 p-4 sm:p-6 rounded-xl bg-card/20 backdrop-blur-lg border border-border/50 shadow-sm transition-all duration-300">
    <div>
      <label className="block text-xs sm:text-sm font-medium text-foreground/90 mb-2">
        Output Format
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {(['avif', 'jpeg', 'jxl', 'png', 'webp'] as const).map((format) => (
          <Button
            key={format}
            className={cn(
              buttonStyles.base,
              buttonStyles.format,
              outputType === format && buttonStyles.formatActive,
              'uppercase text-xs sm:text-sm font-medium focus:outline-none py-2 sm:py-2 w-full',
            )}
            onClick={() => onOutputTypeChange(format)}
          >
            {format}
          </Button>
        ))}
      </div>
    </div>
    {outputType !== 'png' && (
      <div>
        <label
          htmlFor="imageQualityRangeInput"
          className="block text-xs sm:text-sm font-medium text-foreground/90 mb-2 tabular-nums"
        >
          Quality: {options.quality}%
        </label>
        <Slider
          id="imageQualityRangeInput"
          value={[options.quality]}
          min={1}
          max={100}
          step={1}
          onValueChange={(value) => onQualityChange(value[0])}
          className="w-full focus:outline-none"
        />
      </div>
    )}
  </div>
)

// Image Comparison Modal Component
const ImageComparisonModal = ({
  image,
  isOpen,
  onClose,
}: {
  image: ImageFile
  isOpen: boolean
  onClose: () => void
}) => {
  if (!isOpen || !image.file || !image.blob) return null

  const originalImageUrl = URL.createObjectURL(image.file)
  const compressedImageUrl = URL.createObjectURL(image.blob)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-card/95 backdrop-blur-lg rounded-xl border border-border/50 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Image Comparison
            </h3>
            <p className="text-sm text-muted-foreground">{image.file.name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-foreground/70 hover:text-foreground hover:bg-background/50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4">
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Original ({formatFileSize(image.originalSize)})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>
                Compressed ({formatFileSize(image.compressedSize || 0)})
                {image.compressedSize && (
                  <span className="ml-1 text-green-400 font-medium">
                    (-
                    {Math.round(
                      ((image.originalSize - image.compressedSize) /
                        image.originalSize) *
                        100,
                    )}
                    %)
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="relative aspect-video w-full max-h-[60vh] overflow-hidden rounded-lg border border-border/30">
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src={originalImageUrl}
                  alt="Original image"
                  style={{ objectFit: 'contain' }}
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={compressedImageUrl}
                  alt="Compressed image"
                  style={{ objectFit: 'contain' }}
                />
              }
              position={50}
              style={{ height: '100%' }}
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Drag the slider to compare original (left) vs compressed (right)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Image Item Component
const ImageItem = ({
  image,
  onRemove,
  onDownload,
  onRetry,
  onCompare,
}: {
  image: ImageFile
  onRemove: (id: string) => void
  onDownload: (image: ImageFile) => void
  onRetry: (id: string) => void
  onCompare: (image: ImageFile) => void
}) => (
  <div
    className={cn(
      'rounded-xl bg-gradient-to-r from-[#1a1b2e]/50 to-[#2a2b3e]/50 backdrop-blur-lg',
      'border border-border/30 shadow-lg p-4',
      'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
    )}
  >
    <div className="flex items-start gap-3 mb-3">
      {image.preview && (
        <div className="relative w-14 h-14 overflow-hidden rounded-lg border border-border/30 flex-shrink-0">
          <Link
            href={image.preview}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <Image
              src={image.preview}
              alt={image.file.name}
              width={56}
              height={56}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              unoptimized
            />
          </Link>
        </div>
      )}

      <div className="flex items-center gap-1 ml-auto">
        {image.status === 'complete' && image.blob && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCompare(image)}
            className="text-foreground/70 hover:text-yellow-400 hover:bg-yellow-500/20 rounded-lg w-8 h-8 transition-all duration-200 hover:scale-105"
            title="Compare Original vs Compressed"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        {image.status === 'complete' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDownload(image)}
            className="text-foreground/70 hover:text-green-400 hover:bg-green-500/20 rounded-lg w-8 h-8 transition-all duration-200 hover:scale-105"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
        {image.status === 'error' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRetry(image.id)}
            className="text-foreground/70 hover:text-yellow-400 hover:bg-yellow-500/20 rounded-lg w-8 h-8 transition-all duration-200 hover:scale-105"
            title="Retry"
          >
            <AlertCircle className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(image.id)}
          className="text-foreground/70 hover:text-red-400 hover:bg-red-200 rounded-lg w-8 h-8 transition-all duration-200 hover:scale-105"
          title="Remove"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>

    <div className="mb-3">
      <p
        className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent truncate"
        title={image.file.name}
      >
        {image.file.name}
      </p>
    </div>

    <div className="mb-3">
      <div className="flex items-center text-xs text-muted-foreground/90">
        {image.status === 'pending' && (
          <span className="flex items-center gap-1.5 font-medium text-blue-400">
            <div className="w-2 h-2 rounded-full bg-blue-400/60"></div>
            Ready to process
          </span>
        )}
        {image.status === 'processing' && (
          <span className="flex items-center gap-1.5 text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing...
          </span>
        )}
        {image.status === 'complete' && (
          <span className="flex items-center gap-1.5 text-green-400">
            <CheckCircle className="w-3 h-3" />
            Complete
          </span>
        )}
        {image.status === 'error' && (
          <span className="flex items-center gap-1.5 text-red-400">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        )}
      </div>
    </div>

    <div className="text-xs text-muted-foreground/80">
      <span className="tabular-nums">{formatFileSize(image.originalSize)}</span>
      {image.compressedSize && (
        <>
          <ArrowRight className="inline w-3 h-3 mx-1 text-muted-foreground/60" />
          <span className="tabular-nums">
            {formatFileSize(image.compressedSize)}
          </span>
          <span className="ml-1 text-green-400 font-medium">
            (-
            {Math.round(
              ((image.originalSize - image.compressedSize) /
                image.originalSize) *
                100,
            )}
            %)
          </span>
        </>
      )}
    </div>

    {image.status === 'error' && image.error && (
      <div className="text-xs text-red-400/90 bg-red-500/10 px-2 py-1 rounded mt-3 border border-red-500/20">
        {image.error}
      </div>
    )}
  </div>
)

// Sample Images Component
const SampleImages = ({
  onSampleImageClick,
}: {
  onSampleImageClick: (url: string) => void
}) => (
  <div className="mt-4 sm:mt-6">
    <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
      Try Sample Images
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
      {sampleImages.map((url, index) => (
        <button
          key={index}
          onClick={() => onSampleImageClick(url)}
          className="relative aspect-square w-full overflow-hidden rounded-xl border border-border hover:border-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <Image
            src={url}
            alt={`Sample ${index + 1}`}
            width={288}
            height={288}
            className="object-cover"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </button>
      ))}
    </div>
  </div>
)

export default function Squish() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [outputType, setOutputType] = useState<OutputType>('webp')
  const [options, setOptions] = useState<CompressionOptionsType>({
    quality: DEFAULT_QUALITY_SETTINGS.webp,
  })
  const [isDownloading, setIsDownloading] = useState(false)
  const [isZipping, setIsZipping] = useState(false)
  const [compareImage, setCompareImage] = useState<ImageFile | null>(null)

  const { addToQueue } = useImageQueue(options, outputType, setImages)

  // Handle output format change
  const handleOutputTypeChange = useCallback((type: OutputType) => {
    setOutputType(type)
    if (type !== 'png') {
      setOptions({ quality: DEFAULT_QUALITY_SETTINGS[type] })
    }
  }, [])

  // Handle file drop or selection
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newImages = acceptedFiles
        .filter(
          (file) =>
            file.type.startsWith('image/') ||
            file.name.toLowerCase().endsWith('.jxl'),
        )
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
          status: 'pending' as const,
          originalSize: file.size,
          preview: URL.createObjectURL(file),
        }))
      setImages((prev) => [...prev, ...newImages])
      toast.info(`Processing ${acceptedFiles.length} image(s)...`)
      requestAnimationFrame(() => {
        newImages.forEach((image) => addToQueue(image.id))
      })
    },
    [addToQueue],
  )

  // Handle paste event for images
  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const clipboardItems = event.clipboardData.items
      const imageFiles: File[] = []
      for (const item of clipboardItems) {
        if (item.type.startsWith('image')) {
          const file = item.getAsFile()
          if (file) {
            imageFiles.push(file)
          }
        }
      }
      if (imageFiles.length > 0) {
        onDrop(imageFiles)
      }
    },
    [onDrop],
  )

  // Handle sample image click
  const handleSampleImageClick = useCallback(
    async (url: string) => {
      try {
        toast.info('Loading sample image...')
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          headers: { Accept: 'image/jpeg, image/png' },
        })
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`)
        const blob = await response.blob()
        if (!blob.type.startsWith('image/'))
          throw new Error('Fetched content is not an image')
        const file = new File([blob], 'sample-image.jpg', { type: blob.type })
        onDrop([file])
      } catch (error) {
        toast.error(
          `Failed to load sample image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },
    [onDrop],
  )

  // Handle removing a single image
  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id)
      if (image?.preview) URL.revokeObjectURL(image.preview)
      return prev.filter((img) => img.id !== id)
    })
  }, [])

  // Handle retrying a failed image
  const handleRetryImage = useCallback(
    (id: string) => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, status: 'pending' as const, error: undefined }
            : img,
        ),
      )
      addToQueue(id)
      toast.info('Retrying image processing...')
    },
    [addToQueue],
  )

  // Handle clearing all images
  const handleClearAll = useCallback(() => {
    images.forEach((image) => {
      if (image.preview) URL.revokeObjectURL(image.preview)
    })
    setImages([])
    toast.success('All images cleared')
  }, [images])

  // Handle comparing images
  const handleCompareImage = (image: ImageFile) => {
    setCompareImage(image)
  }

  // Handle downloading all completed images
  const handleDownloadAll = useCallback(async () => {
    setIsDownloading(true)
    try {
      const completedImages = images.filter((img) => img.status === 'complete')
      for (const image of completedImages) {
        if (image.blob && image.outputType) {
          await downloadImage(image)
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
      toast.success(`Downloaded ${completedImages.length} image(s)`)
    } catch (error) {
      logger.error(
        `Error downloading images: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { images },
      )
      toast.error('Failed to download images')
    } finally {
      setIsDownloading(false)
    }
  }, [images])

  // Handle downloading all completed images as a ZIP
  const handleDownloadZip = useCallback(async () => {
    setIsZipping(true)
    try {
      const zip = new JSZip()
      const completedImages = images.filter((img) => img.status === 'complete')

      for (const image of completedImages) {
        if (image.blob && image.outputType) {
          const fileName = `${image.file.name.split('.')[0]}.${image.outputType}`
          zip.file(fileName, image.blob)
        }
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = 'squish-images.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Downloaded ${completedImages.length} image(s) as ZIP`)
    } catch (error) {
      logger.error(
        `Error creating ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { images },
      )
      toast.error('Failed to create ZIP file')
    } finally {
      setIsZipping(false)
    }
  }, [images])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
      'image/jxl': ['.jxl'],
    },
  })

  const completedImages = useMemo(
    () => images.filter((img) => img.status === 'complete').length,
    [images],
  )

  return (
    <div onPaste={handlePaste} className="container mx-2 sm:mx-auto p-2 sm:p-4">
      <Card className="border-none bg-card/20 backdrop-blur-lg">
        <CardHeader className="border-b border-border px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Squish
            </CardTitle>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Compress images up to 90% while maintaining high quality, completely
            free and without the need for uploading.
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <CompressionOptions
            outputType={outputType}
            options={options}
            onOutputTypeChange={handleOutputTypeChange}
            onQualityChange={(value) => setOptions({ quality: value })}
          />
          <div
            {...getRootProps()}
            className={cn(
              'p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300',
              'bg-[#1a1b2e]/40 backdrop-blur-md',
              'hover:border-blue-500/80 hover:bg-blue-500/10',
              {
                'border-green-500/70 bg-green-500/10': isDragAccept,
                'border-red-500/70 bg-red-500/10': isDragReject,
                'border-blue-500/70 bg-blue-500/10': isDragActive,
                'border-white/[0.1]':
                  !isDragActive && !isDragAccept && !isDragReject,
              },
            )}
          >
            <input {...getInputProps()} className="hidden" />
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-14 h-14 text-blue-400" />
              <p className="text-xl text-foreground/90">
                {isDragActive
                  ? 'Drop your images here...'
                  : 'Drag and drop images here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to select files (JPEG, PNG, WebP, AVIF, JXL)
              </p>
            </div>
          </div>
          <div className="flex sm:flex-nowrap flex-wrap gap-3">
            {completedImages > 0 && (
              <Button
                onClick={handleDownloadAll}
                disabled={isDownloading || isZipping}
                aria-label={
                  isDownloading
                    ? 'Downloading images'
                    : `Download all ${completedImages} images`
                }
                aria-disabled={isDownloading || isZipping}
                className={cn(
                  buttonStyles.base,
                  buttonStyles.download,
                  'flex-1',
                  (isDownloading || isZipping) &&
                    'opacity-50 cursor-not-allowed pointer-events-none',
                )}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                {isDownloading
                  ? 'Downloading...'
                  : `Download All (${completedImages} ${completedImages === 1 ? 'image' : 'images'})`}
              </Button>
            )}
            {completedImages > 0 && (
              <Button
                onClick={handleDownloadZip}
                disabled={isZipping || isDownloading}
                aria-label={
                  isZipping
                    ? 'Creating ZIP file'
                    : `Download all ${completedImages} images as ZIP`
                }
                aria-disabled={isZipping || isDownloading}
                className={cn(
                  buttonStyles.base,
                  buttonStyles.downloadZip,
                  'flex-1',
                  (isZipping || isDownloading) &&
                    'opacity-50 cursor-not-allowed pointer-events-none',
                )}
              >
                {isZipping ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <FileArchive className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                {isZipping
                  ? 'Creating ZIP...'
                  : `Download ZIP (${completedImages} ${completedImages === 1 ? 'image' : 'images'})`}
              </Button>
            )}
            {images.length > 0 && (
              <Button
                onClick={handleClearAll}
                className={cn(buttonStyles.base, buttonStyles.clear, 'flex-1')}
                aria-label="Clear all images"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Clear All Images
              </Button>
            )}
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((image) => (
                <ImageItem
                  key={image.id}
                  image={image}
                  onRemove={handleRemoveImage}
                  onDownload={downloadImage}
                  onRetry={handleRetryImage}
                  onCompare={handleCompareImage}
                />
              ))}
            </div>
          )}
          {images.length === 0 && (
            <SampleImages onSampleImageClick={handleSampleImageClick} />
          )}
        </CardContent>
      </Card>

      {compareImage && (
        <ImageComparisonModal
          image={compareImage}
          isOpen={!!compareImage}
          onClose={() => setCompareImage(null)}
        />
      )}
    </div>
  )
}
