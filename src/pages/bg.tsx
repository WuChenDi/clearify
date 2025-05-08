'use client'

import { Upload, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Images } from '@/components/bg/Images'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { processImages, initializeModel, getModelInfo } from '@/lib/process'
import { cn } from '@/lib/utils'

interface AppError {
  message: string;
}

export interface ImageFile {
  id: number;
  file: File;
  processedFile?: File;
}

// Sample images from Unsplash
const sampleImages = [
  'https://images.unsplash.com/photo-1601233749202-95d04d5b3c00?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3',
  'https://images.unsplash.com/photo-1513013156887-d2bf241c8c82?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3',
  'https://images.unsplash.com/photo-1643490745745-e8ca9a3a1c90?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=2333&auto=format&fit=crop&ixlib=rb-4.0.3'
  // 'https://notes-wudi.vercel.app/images/logo.png',
  // 'https://res.cloudinary.com/dhzm2rp05/image/upload/live/bnkimad5x2uhhckrrgwj.jpg',
  // 'https://res.cloudinary.com/dhzm2rp05/image/upload/live/frqwlydme2xvzvttrbgh.jpg',
  // 'https://res.cloudinary.com/dhzm2rp05/image/upload/live/t7lklpmhyyrk84p5vfqr.jpg'
]

export default function BG() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)
  const [isWebGPU, setIsWebGPU] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [currentModel, setCurrentModel] = useState<'briaai/RMBG-1.4' | 'Xenova/modnet'>('briaai/RMBG-1.4')
  const [isModelSwitching, setIsModelSwitching] = useState(false)
  const [images, setImages] = useState<ImageFile[]>([])

  useEffect(() => {
    // Only check iOS on load since that won't change
    const { isIOS: isIOSDevice } = getModelInfo()
    setIsIOS(isIOSDevice)
    setIsLoading(false)
  }, [])

  const handleModelChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value as typeof currentModel
    setIsModelSwitching(true)
    setError(null)
    try {
      const initialized = await initializeModel(newModel)
      if (!initialized) {
        throw new Error('Failed to initialize new model')
      }
      setCurrentModel(newModel)
      toast.success(`Model changed to ${newModel}`)
    } catch (err) {
      if (err instanceof Error && err.message.includes('Falling back')) {
        setCurrentModel('briaai/RMBG-1.4')
        toast.info('Falling back to RMBG-1.4 model')
      } else {
        setError({
          message: err instanceof Error ? err.message : 'Failed to switch models'
        })
        toast.error(`Model switch failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    } finally {
      setIsModelSwitching(false)
    }
  }

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
        // Update WebGPU support status after model initialization
        const { isWebGPUSupported } = getModelInfo()
        setIsWebGPU(isWebGPUSupported)
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
    <div className="min-h-screen" onPaste={handlePaste}>
      <Card className="border-none bg-card/20 backdrop-blur-lg">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent text-center md:text-left w-full md:w-auto">
              Background Remover
            </CardTitle>
            {!isIOS && (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-full md:w-auto">
                <span className="text-muted-foreground hidden md:inline">Model:</span>
                <Select 
                  value={currentModel} 
                  onValueChange={(value) => handleModelChange({ target: { value } } as any)}
                  disabled={!isWebGPU || isLoading || isModelSwitching}
                >
                  <SelectTrigger className="bg-card/50 border border-border w-full md:w-[200px]">
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover/90">
                    <SelectItem value="briaai/RMBG-1.4">RMBG-1.4 (Cross-browser)</SelectItem>
                    {isWebGPU && (
                      <SelectItem value="Xenova/modnet">MODNet (WebGPU)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {isIOS && (
            <p className="text-sm text-muted-foreground mt-2">
              Using optimized iOS background removal
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
                  'cursor-not-allowed opacity-70': isLoading || isModelSwitching
                }
              )}
            >
              <input {...getInputProps()} className="hidden" disabled={isLoading || isModelSwitching} />
              <div className="flex flex-col items-center gap-2">
                {isLoading || isModelSwitching ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-2"></div>
                    <p className="text-lg text-foreground/80">
                      {isModelSwitching ? 'Switching models...' : 'Loading background removal model...'}
                    </p>
                  </>
                ) : error ? (
                  <>
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                    <p className="text-lg text-red-500 font-medium mb-2">{error.message}</p>
                    {currentModel === 'Xenova/modnet' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleModelChange({ target: { value: 'briaai/RMBG-1.4' }} as any)
                        }}
                        className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600 hover:to-purple-600 border-none"
                      >
                        Switch to Cross-browser Version
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-blue-400" />
                    <p className="text-lg text-foreground/80">
                      {isDragActive
                        ? 'Drop the images here...'
                        : 'Drag and drop images here'}
                    </p>
                    <p className="text-sm text-muted-foreground">or click to select files</p>
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
