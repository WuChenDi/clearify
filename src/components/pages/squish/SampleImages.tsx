'use client'

import Image from 'next/image'

import { Field } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { sampleImages } from '@/lib'

interface SampleImagesProps {
  onSampleImageClick: (url: string) => void
}

export const SampleImages = ({ onSampleImageClick }: SampleImagesProps) => (
  <Field>
    <Label>Try Sample Images</Label>
    <div className="grid grid-cols-2 gap-3">
      {sampleImages.map((url, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: no unique identifier available
          key={index}
          onClick={() => onSampleImageClick(url)}
          className="relative aspect-square overflow-hidden rounded-md transition-shadow duration-200 hover:ring-2 hover:ring-primary cursor-pointer"
        >
          <Image
            src={url}
            alt={`Sample ${index + 1}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ))}
    </div>
  </Field>
)
