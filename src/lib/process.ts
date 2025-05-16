import {
  env,
  AutoModel,
  AutoProcessor,
  RawImage,
  PreTrainedModel,
  Processor
} from '@huggingface/transformers'

import logger from '@/lib/logger'

// Only using the MODNet model
const MODEL_ID = 'wuchendi/MODNet'

interface ModelState {
  model: PreTrainedModel | null;
  processor: Processor | null;
  isWebGPUSupported: boolean;
  isIOS: boolean;
}

interface ModelInfo {
  isWebGPUSupported: boolean;
  isIOS: boolean;
}

// iOS detection
const isIOS = () =>
  ['iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document)

// State initialization
const state: ModelState = {
  model: null,
  processor: null,
  isWebGPUSupported: Boolean(navigator.gpu),
  isIOS: isIOS()
}

// Configure environment
function configureEnv(useProxy: boolean) {
  env.allowLocalModels = false
  env.cacheDir = '' // Disable cache to avoid initialization issues
  if (env.backends?.onnx?.wasm) {
    logger.debug('Configuring WASM backend:', env.backends.onnx.wasm)
    env.backends.onnx.wasm.proxy = useProxy
    env.backends.onnx.wasm.numThreads = 1 // Optimize for single-threaded performance
    env.backends.onnx.wasm.initTimeout = 10000 // Set 10-second timeout for WASM initialization
    logger.debug('WASM backend configured:', env.backends.onnx.wasm)
  } else {
    logger.warn('WASM backend not available, skipping configuration')
  }
}

// Initialize WebGPU model
export async function initializeModel(): Promise<boolean> {
  // Check for WebGPU support
  if (!navigator.gpu) {
    throw new Error('WebGPU is not supported in your browser. Please use Chrome 113+ or Edge 113+.')
  }

  // Check for iOS (which doesn't support WebGPU)
  if (state.isIOS) {
    throw new Error('WebGPU is not supported on iOS devices. Please use a desktop browser.')
  }

  try {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('Failed to get WebGPU adapter. Your GPU may not be supported.')
    }

    // Configure environment for WebGPU
    configureEnv(true) // Enable proxy for reliable WASM loading

    // Add delay to ensure WASM backend is ready
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Log WASM configuration for debugging
    logger.debug('WASM configuration:', env.backends?.onnx?.wasm)
    
    state.model = await AutoModel.from_pretrained(MODEL_ID, {
      device: 'webgpu',
      progress_callback: (progress) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (progress.progress) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          logger.log(`Model loading progress: ${(progress.progress).toFixed(2)}%`)
        }
      }
    })
    state.processor = await AutoProcessor.from_pretrained(MODEL_ID, {})
    state.isWebGPUSupported = true
    return true
  } catch (error) {
    logger.error('WebGPU initialization failed:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to initialize WebGPU-based model')
  }
}

// Get current model info
export function getModelInfo(): ModelInfo {
  return {
    isWebGPUSupported: Boolean(navigator.gpu),
    isIOS: state.isIOS
  }
}

export async function processImage(image: File): Promise<File> {
  if (!state.model || !state.processor) {
    throw new Error('Model not initialized, please call initializeModel() first')
  }

  try {
    const img = await RawImage.fromURL(URL.createObjectURL(image))
    const { pixel_values } = await state.processor(img)
    const { output } = await state.model({ input: pixel_values })

    // Resize mask back to original size
    const maskData = (
      await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(
        img.width,
        img.height
      )
    ).data

    // Create new canvas
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Unable to get 2D context')

    // Draw original image output to canvas
    ctx.drawImage(img.toCanvas(), 0, 0)

    // Update alpha channel
    const pixelData = ctx.getImageData(0, 0, img.width, img.height)
    for (let i = 0; i < maskData.length; ++i) {
      pixelData.data[4 * i + 3] = maskData[i]
    }
    ctx.putImageData(pixelData, 0, 0)

    // Convert to Blob
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Failed to create Blob'))), 'image/png')
    )

    const [fileName] = image.name.split('.')
    return new File([blob], `${fileName}-bg-removed.png`, { type: 'image/png' })
  } catch (error) {
    logger.error('Image processing failed:', error)
    throw new Error('Image processing failed')
  }
}

export async function processImages(images: File[]): Promise<File[]> {
  logger.log('Starting image processing...')
  const processedFiles: File[] = []

  for (const image of images) {
    try {
      const processedFile = await processImage(image)
      processedFiles.push(processedFile)
      logger.log(`Successfully processed image: ${image.name}`)
    } catch (error) {
      logger.error(`Failed to process image ${image.name}:`, error)
    }
  }

  logger.log('Image processing completed')
  return processedFiles
}
