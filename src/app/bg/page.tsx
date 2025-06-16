'use client'

import { Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Images } from '@/components/bg/Images'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib'
import logger from '@/lib/logger'
import { processImages, initializeModel, getModelInfo } from '@/lib/process'


interface BgError {
  message: string;
}

export interface ImageFile {
  id: number;
  file: File;
  processedFile?: File;
}

// Define the model type to improve type safety
type RemovalModel = 'briaai/RMBG-1.4' | 'wuchendi/MODNet' | 'briaai/RMBG-2.0';

// Define model status type
type ModelStatus = 'ready' | 'unavailable' | 'loading';

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
  const [currentModel, setCurrentModel] = useState<RemovalModel>('wuchendi/MODNet')
  const [isModelSwitching, setIsModelSwitching] = useState(false)
  const [images, setImages] = useState<ImageFile[]>([])
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading')

  useEffect(() => {
    // Check iOS and initialize model on load
    const { isIOS: isIOSDevice, isWebGPUSupported } = getModelInfo()
    setIsIOS(isIOSDevice)
    setIsWebGPU(isWebGPUSupported)
    
    // Attempt to initialize MODNet first
    const initModel = async () => {
      setIsLoading(true)
      setModelStatus('loading')
      setError(null)
      try {
        const initialized = await initializeModel('wuchendi/MODNet')
        if (!initialized) {
          throw new Error('Failed to initialize MODNet model')
        }
        setCurrentModel('wuchendi/MODNet')
        setModelStatus('ready')
        toast.success('MODNet model loaded successfully')
      } catch (err) {
        // Fallback to RMBG-2.0, then RMBG-1.4 if needed
        try {
          const fallbackInitialized = await initializeModel('briaai/RMBG-2.0')
          if (!fallbackInitialized) {
            throw new Error('Failed to initialize RMBG-2.0 model')
          }
          setCurrentModel('briaai/RMBG-2.0')
          setModelStatus('ready')
          toast.success('RMBG-2.0 model loaded successfully')
        } catch (fallbackErr) {
          try {
            const finalFallbackInitialized = await initializeModel('briaai/RMBG-1.4')
            if (!finalFallbackInitialized) {
              throw new Error('Failed to initialize RMBG-1.4 model')
            }
            setCurrentModel('briaai/RMBG-1.4')
            setModelStatus('unavailable')
            setError({ message: 'MODNet and RMBG-2.0 not supported, switched to RMBG-1.4' })
            toast.info('Switched to RMBG-1.4 as fallback')
          } catch (finalErr) {
            setError({
              message: finalErr instanceof Error ? finalErr.message : 'Failed to load any model'
            })
            setModelStatus('unavailable')
            toast.error(`Model loading failed: ${finalErr instanceof Error ? finalErr.message : 'Unknown error'}`)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    initModel()
  }, [])

  // Create a properly typed handler for model changes
  const handleModelChange = async (value: RemovalModel) => {
    setIsModelSwitching(true)
    setModelStatus('loading')
    setError(null)
    try {
      const initialized = await initializeModel(value)
      if (!initialized) {
        throw new Error('Failed to initialize new model')
      }
      setCurrentModel(value)
      setModelStatus(value === 'wuchendi/MODNet' ? 'ready' : 'unavailable')
      toast.success(`Model changed to ${value}`)
    } catch (err) {
      if (err instanceof Error && err.message.includes('Falling back')) {
        setCurrentModel('briaai/RMBG-1.4')
        setModelStatus('unavailable')
        setError({ message: 'MODNet not supported, switched to RMBG-1.4' })
        toast.info('MODNet not supported, switched to RMBG-1.4')
      } else {
        setError({
          message: err instanceof Error ? err.message : 'Failed to switch models'
        })
        setModelStatus('unavailable')
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
        logger.error('Error processing image:', error)
        toast.error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }, [])

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
      logger.log('Fetching URL:', url)
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'image/jpeg, image/png'
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      logger.log('Blob received, size:', blob.size)
      if (!blob.type.startsWith('image/')) {
        throw new Error('Fetched content is not an image')
      }
      const file = new File([blob], 'sample-image.jpg', { type: blob.type })
      logger.log('File created:', file)
      onDrop([file])
    } catch (error) {
      logger.error('Error loading sample image:', error)
      toast.error(`Failed to load sample image: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent text-center md:text-left w-full md:w-auto">
              Background Remover
            </CardTitle>
            {!isIOS && (
              <div className="flex flex-col items-start gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Select Model:</span>
                  {currentModel === 'wuchendi/MODNet' && (
                    <div className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-full text-sm',
                      {
                        'bg-green-500/20 text-green-400': modelStatus === 'ready',
                        'bg-yellow-500/20 text-yellow-400': modelStatus === 'unavailable',
                        'bg-blue-500/20 text-blue-400': modelStatus === 'loading'
                      }
                    )}>
                      {modelStatus === 'ready' && <CheckCircle className="w-4 h-4" />}
                      {modelStatus === 'unavailable' && <XCircle className="w-4 h-4" />}
                      {modelStatus === 'loading' && (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400"></div>
                      )}
                      <span>
                        {modelStatus === 'ready' ? 'Ready' : modelStatus === 'unavailable' ? 'Unavailable' : 'Loading'}
                      </span>
                    </div>
                  )}
                </div>
                <Select 
                  value={currentModel} 
                  onValueChange={(value: RemovalModel) => handleModelChange(value)}
                  disabled={isLoading || isModelSwitching}
                >
                  <SelectTrigger className="bg-card/50 border border-border w-full md:w-[220px] rounded-md p-2 focus:ring-2 focus:ring-blue-400">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover/90 rounded-md">
                    <SelectItem value="wuchendi/MODNet">MODNet (WebGPU)</SelectItem>
                    <SelectItem value="briaai/RMBG-2.0">RMBG-2.0 (Advanced)</SelectItem>
                    <SelectItem value="briaai/RMBG-1.4">RMBG-1.4 (Cross-browser)</SelectItem>
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
        <CardContent className="p-6">
          <div className="relative space-y-6">
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
                  'border-white/[0.1]': !isDragActive && !isDragAccept && !isDragReject,
                  'cursor-not-allowed opacity-60': isLoading || isModelSwitching
                }
              )}
            >
              <input {...getInputProps()} className="hidden" disabled={isLoading || isModelSwitching} />
              <div className="flex flex-col items-center gap-3">
                {isLoading || isModelSwitching ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-400 mb-3"></div>
                    <p className="text-xl text-foreground/90">
                      {isModelSwitching ? 'Switching models...' : 'Loading background removal model...'}
                    </p>
                  </>
                ) : error ? (
                  <>
                    <AlertTriangle className="w-14 h-14 text-red-500" />
                    <p className="text-lg text-red-500 font-medium mb-3">{error.message}</p>
                    {currentModel === 'wuchendi/MODNet' && error.message.includes('MODNet not supported') && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleModelChange('briaai/RMBG-2.0')
                        }}
                        className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600 hover:to-purple-600 border-none rounded-md px-4 py-2"
                      >
                        Switch to RMBG-2.0
                      </Button>
                    )}
                    {(currentModel === 'briaai/RMBG-2.0' || currentModel === 'wuchendi/MODNet') && error.message.includes('not supported') && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleModelChange('briaai/RMBG-1.4')
                        }}
                        className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600 hover:to-purple-600 border-none rounded-md px-4 py-2 mt-2"
                      >
                        Switch to RMBG-1.4
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Upload className="w-14 h-14 text-blue-400" />
                    <p className="text-xl text-foreground/90">
                      {isDragActive
                        ? 'Drop your images here...'
                        : 'Drag and drop images here'}
                    </p>
                    <p className="text-sm text-muted-foreground">or click to select files (JPEG, PNG, WEBP)</p>
                  </>
                )}
              </div>
            </div>

            {images.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleClearAllImages} 
                className="w-full bg-gradient-to-r from-red-500/80 to-orange-500/80 hover:from-red-600 hover:to-orange-600 border-none rounded-md py-2"
              >
                Clear All Images
              </Button>
            )}

            {images.length === 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
                  Try Sample Images:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {sampleImages.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleImageClick(url)}
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
            )}

            <Images images={images} onDelete={(id) => setImages(prev => prev.filter(img => img.id !== id))} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
