'use client'

import { Upload } from 'lucide-react'
import { downloadImage } from '@/lib'
import type { ImageFile } from '@/types'
import { ImageItem } from './ImageItem'

interface RightPanelProps {
  images: ImageFile[]
  handleRemoveImage: (id: string) => void
  handleRetryImage: (id: string) => void
  handleCompareImage: (image: ImageFile) => void
}

export const RightPanel = ({
  images,
  handleRemoveImage,
  handleRetryImage,
  handleCompareImage,
}: RightPanelProps) => {
  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center">
            <Upload className="w-10 h-10 text-blue-400/50" />
          </div>
          <p className="text-lg text-muted-foreground">No images yet</p>
          <p className="text-sm text-muted-foreground/70">
            Upload images to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 p-0.5">
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
  )
}
