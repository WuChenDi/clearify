'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import {
  AlertTriangle,
  FileVideo,
  Loader2,
  Settings,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import VideoSettings from '@/components/compress/VideoSettings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn, formatFileSize, logger } from '@/lib'
import type { ConversionSettings } from '@/types'
import { defaultSettings } from '@/types'

const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd'

export default function Compress() {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [video, setVideo] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [outputUrl, setOutputUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedSize, setProcessedSize] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)

  // Load FFmpeg with logging enabled
  const loadFFmpeg = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg()
      }

      const ffmpeg = ffmpegRef.current
      if (!ffmpeg.loaded) {
        ffmpeg.on('log', ({ type, message }) => {
          logger.log(`[FFmpeg Log] [${type}]`, message)
        })
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            'text/javascript',
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            'application/wasm',
          ),
        })
        setIsReady(true)
        toast.success('Video processor loaded successfully')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load video processor'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset component state
  const resetState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setVideo(null)
    setProgress(0)
    setOutputUrl('')
    setIsProcessing(false)
    setProcessedSize(null)
    setPreviewUrl('')
    setSettings(defaultSettings)
    setError(null)
    if (videoRef.current) videoRef.current.src = ''
    if (previewRef.current) previewRef.current.src = ''
  }

  // Generate preview URL for selected video
  useEffect(() => {
    if (video) {
      const url = URL.createObjectURL(video)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [video])

  // Update preview video position based on compression progress
  useEffect(() => {
    if (previewRef.current && videoRef.current && isProcessing) {
      const duration = videoRef.current.duration
      if (duration) {
        previewRef.current.currentTime = (progress / 100) * duration
      }
    }
  }, [progress, isProcessing])

  // Compress video using FFmpeg
  const compressVideo = async () => {
    if (!video || !isReady || !ffmpegRef.current) return

    setIsProcessing(true)
    setProgress(0)
    setProcessedSize(0)
    setError(null)

    const ffmpeg = ffmpegRef.current

    try {
      await ffmpeg.writeFile('input.mp4', await fetchFile(video))
      ffmpeg.on('progress', ({ progress: ratio }) => {
        const percent = Math.round(ratio * 100)
        setProgress(percent)
        setProcessedSize(Math.min(video.size * ratio * 0.4, video.size * 0.4))
      })

      const args = ['-i', 'input.mp4', '-c:v', settings.videoCodec]
      switch (settings.compressionMethod) {
        case 'bitrate':
          args.push('-b:v', settings.videoBitrate)
          break
        case 'crf':
          args.push('-crf', settings.crfValue || '23')
          break
        case 'percentage':
          const crf = Math.round(
            51 - (parseInt(settings.targetPercentage || '100') / 100) * 33,
          )
          args.push('-crf', crf.toString())
          break
        case 'filesize':
          const targetBitrate = Math.round(
            (parseInt(settings.targetFilesize || '100') * 8192) /
              (videoRef.current?.duration || 60),
          )
          args.push('-b:v', `${targetBitrate}k`)
          break
      }
      args.push(
        '-c:a',
        settings.audioCodec,
        '-b:a',
        settings.audioBitrate,
        '-r',
        settings.frameRate,
        'output.mp4',
      )

      await ffmpeg.exec(args)
      const outputData = await ffmpeg.readFile('output.mp4')
      const blob = new Blob([outputData as BlobPart], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)

      setOutputUrl(url)
      setProgress(100)
      setProcessedSize((outputData as Uint8Array).length)
      toast.success('Video compressed successfully')

      await ffmpeg.deleteFile('input.mp4')
      await ffmpeg.deleteFile('output.mp4')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Compression failed'
      setError(errorMessage)
      toast.error(errorMessage)
      setProgress(0)
      setProcessedSize(null)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle file drop using useDropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: {
      'video/*': [],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      resetState()
      setVideo(acceptedFiles[0])
      if (!isReady) await loadFFmpeg()
      toast.info('Video file selected')
    },
  })

  return (
    <Card className="w-full max-w-4xl mx-auto border-none bg-card/20 backdrop-blur-lg">
      <CardHeader className="border-b border-border px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Video Compressor
          </CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="ml-2 h-8 w-8 sm:h-9 sm:w-9"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Compress videos in your browser by up to 90% for free. No upload
          required.
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6 w-full">
          {!video ? (
            <div
              {...getRootProps()}
              className={cn(
                'p-6 sm:p-8 md:p-12 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300 w-full',
                'bg-[#1a1b2e]/40 backdrop-blur-md',
                'hover:border-blue-500/80 hover:bg-blue-500/10',
                {
                  'border-green-500/70 bg-green-500/10': isDragAccept,
                  'border-red-500/70 bg-red-500/10': isDragReject,
                  'border-blue-500/70 bg-blue-500/10': isDragActive,
                  'border-white/[0.1]':
                    !isDragActive && !isDragAccept && !isDragReject,
                  'cursor-not-allowed opacity-60': isLoading,
                },
              )}
            >
              <input
                {...getInputProps()}
                className="hidden"
                disabled={isLoading}
              />
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400 animate-spin" />
                  <p className="text-base sm:text-lg text-foreground/90">
                    Loading video processor...
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
                  <p className="text-base sm:text-lg text-red-500 font-medium">
                    {error}
                  </p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      void loadFFmpeg()
                    }}
                    className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600 hover:to-purple-600 border-none rounded-md px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base"
                  >
                    Retry Loading
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <FileVideo className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" />
                  <p className="text-lg sm:text-xl text-foreground/90">
                    {isDragActive
                      ? 'Drop your video here...'
                      : 'Drag and drop a video file here'}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    or click to select a video (MP4, MOV, etc.)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <FileVideo className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  <span className="font-medium text-sm sm:text-base text-foreground/90 truncate">
                    {video.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetState}
                  className="text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 h-8 w-8 sm:h-9 sm:w-9"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              {!isProcessing && !outputUrl && (
                <Button
                  variant="destructive"
                  onClick={compressVideo}
                  className="w-full bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600 hover:to-purple-600 border-none rounded-md py-1 sm:py-2 text-sm sm:text-base"
                  disabled={!isReady || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Compress Video</span>
                    </>
                  )}
                </Button>
              )}

              {(isProcessing || outputUrl) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-900/20 p-3 sm:p-4 rounded-xl w-full">
                  <div className="flex flex-col items-center">
                    <span className="text-xs uppercase text-gray-400 mb-1">
                      Original
                    </span>
                    <span className="text-lg sm:text-2xl font-bold text-foreground/90">
                      {formatFileSize(video.size)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs uppercase text-gray-400 mb-1">
                      Compressed
                    </span>
                    <span className="text-lg sm:text-2xl font-bold text-foreground/90">
                      {processedSize ? formatFileSize(processedSize) : '0.0'}
                    </span>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-4 w-full">
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={previewUrl}
                      className="absolute inset-0 w-full h-full object-contain opacity-50"
                      muted
                    />
                    <video
                      ref={previewRef}
                      src={previewUrl}
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
                      muted
                    />
                  </div>
                  <Progress value={progress} className="h-2 w-full" />
                  <p className="text-center text-xs sm:text-sm text-muted-foreground">
                    Compressing... {progress}%
                  </p>
                </div>
              )}

              {error && !isProcessing && (
                <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 sm:p-4 rounded-lg w-full">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{error}</span>
                </div>
              )}

              {outputUrl && (
                <div className="space-y-4 w-full">
                  <video
                    src={outputUrl}
                    controls
                    className="w-full rounded-lg object-contain"
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 w-full">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Saved{' '}
                      {processedSize &&
                        ((1 - processedSize / video.size) * 100).toFixed(0)}
                      % of original size
                    </span>
                    <a
                      href={outputUrl}
                      download="compressed-video.mp4"
                      className="inline-flex items-center justify-center px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Download Compressed Video
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <VideoSettings
        settings={settings}
        onSettingsChange={setSettings}
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </Card>
  )
}
