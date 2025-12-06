import { Trash2, Edit2, Download } from 'lucide-react'
import Image from 'next/image'
import React, { useState } from 'react'
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider'

import { ImageFile } from '@/app/bg/page'
import { Button } from '@/components/ui/button'

import { EditModal } from './EditModal'

interface ImagesProps {
  images: ImageFile[]
  // eslint-disable-next-line no-unused-vars
  onDelete: (id: number) => void
}

export function Images({ images, onDelete }: ImagesProps) {
  return (
    <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {images.map((image) => {
        if (image.file.type.includes('video')) {
          return <Video video={image} key={image.id} />
        } else {
          return <ImageSpot image={image} onDelete={onDelete} key={image.id} />
        }
      })}
    </div>
  )
}

function Video({ video }: { video: ImageFile }) {
  const url = URL.createObjectURL(video.file)
  return (
    <div className="bg-white rounded-lg shadow-md p-3">
      <video
        className="rounded-lg aspect-square object-cover"
        loop
        muted
        autoPlay
        src={url}
      ></video>
    </div>
  )
}

interface ImageSpotProps {
  image: ImageFile
  // eslint-disable-next-line no-unused-vars
  onDelete: (id: number) => void
}

function ImageSpot({ image, onDelete }: ImageSpotProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [processedImageUrl, setProcessedImageUrl] = useState('')

  const url = URL.createObjectURL(image.file)
  const processedURL = image.processedFile
    ? URL.createObjectURL(image.processedFile)
    : ''
  const isProcessing = !image.processedFile

  const handleEditSave = (editedImageUrl: string) => {
    setProcessedImageUrl(editedImageUrl)
  }

  const transparentBg =
    'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURb+/v////5nD/3QAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBjTYwABQSCglEENMxgYGAAynwRB8BEAgQAAAABJRU5ErkJggg==")'

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        {isProcessing ? (
          <div className="relative w-full aspect-square">
            <Image
              src={url}
              alt={`Processing image ${image.id}`}
              width={288}
              height={288}
              className="object-cover opacity-50 transition-opacity duration-200"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-50 px-4 py-2 rounded-lg flex items-center">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                <span className="text-white font-medium">Processing...</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-full aspect-square"
            style={{
              background: transparentBg,
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0">
              {/* <Image
                className="object-cover transition-opacity duration-200"
                src={processedImageUrl || processedURL}
                alt={`Processed image ${image.id}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              /> */}
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage src={url} alt="Original Image" />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={processedImageUrl || processedURL}
                    alt="Processed Image"
                    style={{
                      background: transparentBg,
                      backgroundRepeat: 'repeat',
                    }}
                  />
                }
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      {!isProcessing && (
        <div className="p-3 border-t border-gray-100">
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => onDelete(image.id)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-white border-gray-200 hover:bg-gray-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-700">Delete</span>
            </Button>

            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-white border-gray-200 hover:bg-gray-50"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">Edit</span>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-white border-gray-200 hover:bg-gray-50"
              title="Download"
            >
              <a
                href={processedImageUrl || processedURL}
                download={`processed-${image.id}.png`}
              >
                <Download className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Download</span>
              </a>
            </Button>
          </div>
        </div>
      )}

      <EditModal
        image={image}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
      />
    </div>
  )
}
