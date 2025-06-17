import { ensureWasmLoaded } from '@/lib'
import type { OutputType, CompressionOptions, AvifEncodeOptions, JpegEncodeOptions, JxlEncodeOptions, WebpEncodeOptions } from '@/types'

export async function decode(sourceType: string, fileBuffer: ArrayBuffer): Promise<ImageData> {
  // Ensure WASM is loaded for the source type
  await ensureWasmLoaded(sourceType as OutputType)

  try {
    switch (sourceType) {
      case 'avif':
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return await (await import('@jsquash/avif')).decode(fileBuffer)
      case 'jpeg':
      case 'jpg':
        return await (await import('@jsquash/jpeg')).decode(fileBuffer)
      case 'jxl':
        return await (await import('@jsquash/jxl')).decode(fileBuffer)
      case 'png':
        return await (await import('@jsquash/png')).decode(fileBuffer)
      case 'webp':
        return await (await import('@jsquash/webp')).decode(fileBuffer)
      default:
        throw new Error(`Unsupported source type: ${sourceType}`)
    }
  } catch (error) {
    console.error(`Failed to decode ${sourceType} image:`, error)
    throw new Error(`Failed to decode ${sourceType} image`)
  }
}

export async function encode(outputType: OutputType, imageData: ImageData, options: CompressionOptions): Promise<ArrayBuffer> {
  // Ensure WASM is loaded for the output type
  await ensureWasmLoaded(outputType)

  try {
    switch (outputType) {
      case 'avif': {
        const avifOptions: AvifEncodeOptions = {
          quality: options.quality,
          effort: 4 // Medium encoding effort
        }
        const avifModule = await import('@jsquash/avif')
        return await avifModule.encode(imageData, avifOptions)
      }
      case 'jpeg': {
        const jpegOptions: JpegEncodeOptions = {
          quality: options.quality
        }
        const jpegModule = await import('@jsquash/jpeg')
        return await jpegModule.encode(imageData, jpegOptions)
      }
      case 'jxl': {
        const jxlOptions: JxlEncodeOptions = {
          quality: options.quality,
          // TODO:
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          effort: 4 // Medium encoding effort
        }
        const jxlModule = await import('@jsquash/jxl')
        return await jxlModule.encode(imageData, jxlOptions)
      }
      case 'webp': {
        const webpOptions: WebpEncodeOptions = {
          quality: options.quality
        }
        const webpModule = await import('@jsquash/webp')
        return await webpModule.encode(imageData, webpOptions)
      }
      case 'png': {
        const pngModule = await import('@jsquash/png')
        return await pngModule.encode(imageData)
      }
      default:
        throw new Error(`Unsupported output type: ${outputType}`)
    }
  } catch (error) {
    console.error(`Failed to encode ${outputType} image:`, error)
    throw new Error(`Failed to encode ${outputType} image`)
  }
}

export function getFileType(file: File): string {
  if (file.name.toLowerCase().endsWith('jxl')) return 'jxl'
  const type = file.type.split('/')[1]
  return type === 'jpeg' ? 'jpg' : type
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
