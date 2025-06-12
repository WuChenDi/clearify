'use client'

import { Upload, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Images } from '@/components/bg/Images'
import ShinyText from '@/components/reactbits/ShinyText'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { processImages, initializeModel, getModelInfo } from '@/lib/process'
import { cn } from '@/lib/utils'

interface BgError {
  message: string;
}

export interface ImageFile {
  id: number;
  file: File;
  processedFile?: File;
}

// Sample images from Unsplash
const sampleImages = [
  'https://res.cloudinary.com/dhzm2rp05/image/upload/samples/logo.jpg',
  'https://res.cloudinary.com/dhzm2rp05/image/upload/samples/smile.jpg',
  'https://res.cloudinary.com/dhzm2rp05/image/upload/samples/animals/three-dogs.jpg',
  'https://res.cloudinary.com/dhzm2rp05/image/upload/live/t7lklpmhyyrk84p5vfqr.jpg'
]

export default function BG() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<BgError | null>(null)
  const [isWebGPU, setIsWebGPU] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [images, setImages] = useState<ImageFile[]>([])

  useEffect(() => {
    // Only check iOS and WebGPU on load since that won't change
    const { isIOS: isIOSDevice, isWebGPUSupported } = getModelInfo()
    setIsIOS(isIOSDevice)
    setIsWebGPU(isWebGPUSupported)
    setIsLoading(false)
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      processedFile: undefined
    }))
    setImages(prev => [...prev, ...newImages])
    toast.info(`Processing ${acceptedFiles.length} image(s)...`)
    
    // Initialize model if this is the first image
    if (images.length === 0) {
      setIsLoading(true)
      setError(null)
      try {
        const initialized = await initializeModel()
        if (!initialized) {
          throw new Error('Failed to initialize background removal model')
        }
        toast.success('Background removal model loaded successfully')
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'An unknown error occurred'
        })
        setImages([]) // Clear the newly added images if model fails to load
        setIsLoading(false)
        toast.error(`Failed to load model: ${err instanceof Error ? err.message : 'Unknown error'}`)
        return
      }
      setIsLoading(false)
    }
    
    for (const image of newImages) {
      try {
        const result = await processImages([image.file])
        if (result && result.length > 0) {
          setImages(prev => prev.map(img =>
            img.id === image.id
              ? { ...img, processedFile: result[0] }
              : img
          ))
          toast.success('Image processed successfully')
        }
      } catch (error) {
        console.error('Error processing image:', error)
        toast.error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }, [images.length])

  const handlePaste = async (event: React.ClipboardEvent) => {
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
  }  

  const handleSampleImageClick = async (url: string) => {
    try {
      toast.info('Loading sample image...')
      const response = await fetch(url)
      const blob = await response.blob()
      const file = new File([blob], 'sample-image.jpg', { type: 'image/jpeg' })
      onDrop([file])
    } catch (error) {
      console.error('Error loading sample image:', error)
      toast.error('Failed to load sample image')
    }
  }

  const handleClearAllImages = () => {
    setImages([])
    toast.success('All images cleared')
  }

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    }
  })

  return (
    <div onPaste={handlePaste}>
      <Card className="border-none bg-card/20 backdrop-blur-lg">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Background Remover
            </CardTitle>
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center px-3 py-1.5 text-sm rounded-full bg-accent/20 border border-accent/30 hover:bg-accent/30 transition-colors">
                <span className="mr-2">MODNet Model</span>
                {isWebGPU ? (
                  <span className="flex items-center text-green-500">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Ready
                  </span>
                ) : (
                  <span className="flex items-center text-yellow-500">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Unavailable
                  </span>
                )}
              </span>
            </div>
          </div>
          {isIOS && (
            <p className="text-sm text-muted-foreground/80 mt-3 text-center md:text-left">
              Note: This application requires WebGPU, which is not available on iOS devices.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="relative space-y-4">
            <div 
              {...getRootProps()}
              className={cn(
                'mt-4 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300',
                'bg-[#1a1b2e]/30 backdrop-blur-sm',
                'hover:border-[#3b82f6]/70 hover:bg-[#3b82f6]/5',
                {
                  'border-green-500/70 bg-green-500/10': isDragAccept,
                  'border-red-500/70 bg-red-500/10': isDragReject,
                  'border-[#3b82f6]/70 bg-[#3b82f6]/10': isDragActive,
                  'border-white/[0.08]': !isDragActive && !isDragAccept && !isDragReject,
                  'cursor-not-allowed opacity-70': isLoading
                }
              )}
            >
              <input {...getInputProps()} className="hidden" disabled={isLoading} />
              <div className="flex flex-col items-center gap-2">
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-2"></div>
                    <p className="text-lg text-foreground/80">
                      Loading background removal model...
                    </p>
                  </>
                ) : error ? (
                  <>
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                    <p className="text-lg text-red-500 font-medium mb-2">{error.message}</p>
                    {!isWebGPU && (
                      <p className="text-sm text-muted-foreground">
                        This application requires WebGPU support. Please use a WebGPU-compatible browser like Chrome 113+ or Edge 113+.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-blue-400" />
                    <p className="text-lg text-foreground/80">
                      <ShinyText 
                        text={isDragActive
                          ? 'Drop the images here...'
                          : 'Drag and drop images here'}
                        disabled={false} 
                        speed={3} 
                        className='text-base md:text-lg text-gray-600 dark:text-gray-300'
                      />
                    </p>
                    <ShinyText 
                      text="or click to select files"
                      disabled={false} 
                      speed={3} 
                      className='text-base md:text-lg text-gray-600 dark:text-gray-300'
                    />
                    {/* <p className="text-sm text-muted-foreground">or click to select files</p> */}
                  </>
                )}
              </div>
            </div>

            {images.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleClearAllImages} 
                className="mt-4 w-full bg-gradient-to-r from-red-500/80 to-orange-500/80 hover:from-red-600 hover:to-orange-600 border-none"
              >
              Clear All Images
              </Button>
            )}

            {images.length === 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
                  Try these sample images:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sampleImages.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleImageClick(url)}
                      className="relative aspect-square w-full overflow-hidden rounded-lg border border-border hover:border-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <Image
                        src={url}
                        alt={`Sample ${index + 1}`}
                        width={288}
                        height={288}
                        className="object-cove"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Images images={images} onDelete={(id) => setImages(prev => prev.filter(img => img.id !== id))} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
