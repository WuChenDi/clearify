'use client'

import { Upload } from 'lucide-react'

import { cn } from '@/lib'
import type { CompressionOptions as CompressionOptionsType, OutputType } from '@/types'

import { CompressionOptions } from './CompressionOptions'
import { SampleImages } from './SampleImages'

interface LeftPanelProps {
  outputType: OutputType
  options: CompressionOptionsType
  onOutputTypeChange: (type: OutputType) => void
  onQualityChange: (value: number) => void
  getRootProps: any
  getInputProps: any
  isDragActive: boolean
  isDragAccept: boolean
  isDragReject: boolean
  hasImages: boolean
  onSampleImageClick: (url: string) => void
}

export const LeftPanel = ({
  outputType,
  options,
  onOutputTypeChange,
  onQualityChange,
  getRootProps,
  getInputProps,
  isDragActive,
  isDragAccept,
  isDragReject,
  onSampleImageClick,
}: LeftPanelProps) => (
  <div className="space-y-6">
    {/* Compression Options */}
    <CompressionOptions
      outputType={outputType}
      options={options}
      onOutputTypeChange={onOutputTypeChange}
      onQualityChange={onQualityChange}
    />

    {/* Upload Area */}
    <div
      {...getRootProps()}
      className={cn(
        'p-8 border border-dashed rounded-xl text-center cursor-pointer transition-all duration-300',
        'bg-[#1a1b2e]/40 backdrop-blur-md',
        'hover:border-blue-500/80 hover:bg-blue-500/10',
        {
          'border-green-500/70 bg-green-500/10': isDragAccept,
          'border-red-500/70 bg-red-500/10': isDragReject,
          'border-blue-500/70 bg-blue-500/10': isDragActive,
          'border-white/[0.1]': !isDragActive && !isDragAccept && !isDragReject,
        },
      )}
    >
      <input {...getInputProps()} className="hidden" />
      <div className="flex flex-col items-center gap-3">
        <Upload className="w-12 h-12 text-blue-400" />
        <p className="text-base font-medium text-foreground/90">
          {isDragActive ? 'Drop here...' : 'Upload Images'}
        </p>
        <p className="text-xs text-muted-foreground">
          Drag & drop or click to select
        </p>
        <p className="text-xs text-muted-foreground/70">
          JPEG, PNG, WebP, AVIF, JXL
        </p>
      </div>
    </div>

    {/* Sample Images */}
    <SampleImages onSampleImageClick={onSampleImageClick} />
  </div>
)
