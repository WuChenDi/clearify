import { X, Check, Palette, Upload, Image as ImageIcon, Zap, Grid3X3, CircleDot, LineChart, Waves } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'

import { ImageFile } from '@/app/page'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface EditModalProps {
  image: ImageFile;
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSave: (url: string) => void;
}

const backgroundOptions = [
  { id: 'color', label: 'Solid Color', icon: <Palette size={16} /> },
  { id: 'image', label: 'Image', icon: <ImageIcon size={16} /> },
  { id: 'pattern', label: 'Pattern', icon: <Grid3X3 size={16} /> }
]

const effectOptions = [
  { id: 'none', label: 'None', icon: <Check size={16} /> },
  { id: 'blur', label: 'Blur', icon: <Zap size={16} /> },
  { id: 'brightness', label: 'Bright', icon: <Zap size={16} /> },
  { id: 'contrast', label: 'Contrast', icon: <Zap size={16} /> }
]

const predefinedColors = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#00ffff', '#ff00ff', '#808080', '#c0c0c0'
]

const predefinedPatterns = [
  { 
    id: 'dots', 
    label: 'Dots',
    icon: <CircleDot size={16} />,
    generate: (canvas: HTMLCanvasElement, color: string = '#333333') => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = color
      const dotSize = 4
      const spacing = 20

      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          ctx.beginPath()
          ctx.arc(x, y, dotSize, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  },
  { 
    id: 'lines', 
    label: 'Lines',
    icon: <LineChart size={16} />,
    generate: (canvas: HTMLCanvasElement, color: string = '#333333') => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      const spacing = 20

      for (let i = -canvas.height; i < canvas.width + canvas.height; i += spacing) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i - canvas.height, canvas.height)
        ctx.stroke()
      }
    }
  },
  { 
    id: 'grid', 
    label: 'Grid',
    icon: <Grid3X3 size={16} />,
    generate: (canvas: HTMLCanvasElement, color: string = '#333333') => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = color
      ctx.lineWidth = 1
      const spacing = 20

      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }
  },
  { 
    id: 'waves', 
    label: 'Waves',
    icon: <Waves size={16} />,
    generate: (canvas: HTMLCanvasElement, color: string = '#333333') => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = color
      ctx.lineWidth = 3
      const amplitude = 20
      const frequency = 0.01
      const spacing = 30

      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath()
        for (let x = 0; x < canvas.width; x++) {
          const yOffset = Math.sin(x * frequency) * amplitude
          if (x === 0) {
            ctx.moveTo(x, y + yOffset)
          } else {
            ctx.lineTo(x, y + yOffset)
          }
        }
        ctx.stroke()
      }
    }
  }
]

export function EditModal({ image, isOpen, onClose, onSave }: EditModalProps) {
  const [bgType, setBgType] = useState('color')
  const [bgColor, setBgColor] = useState('#000000')
  const [customBgImage, setCustomBgImage] = useState<File | null>(null)
  const [selectedEffect, setSelectedEffect] = useState('none')
  const [blurValue, setBlurValue] = useState(50)
  const [brightnessValue, setBrightnessValue] = useState(50)
  const [contrastValue, setContrastValue] = useState(50)
  const [exportUrl, setExportUrl] = useState('')
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false)
  const [effectValue, setEffectValue] = useState(0)
  const [selectedPattern, setSelectedPattern] = useState('dots')

  const processedURL = image.processedFile ? URL.createObjectURL(image.processedFile) : ''

  useEffect(() => {
    if (image.processedFile) {
      applyChanges()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgType, bgColor, customBgImage, selectedEffect, blurValue, brightnessValue, contrastValue, effectValue, selectedPattern])

  const getCurrentEffectValue = () => {
    switch (selectedEffect) {
      case 'blur':
        return blurValue
      case 'brightness':
        return brightnessValue
      case 'contrast':
        return contrastValue
      default:
        return 50
    }
  }

  const handleEffectValueChange = (value: number) => {
    setEffectValue(value)
    switch (selectedEffect) {
      case 'blur':
        setBlurValue(value)
        break
      case 'brightness':
        setBrightnessValue(value)
        break
      case 'contrast':
        setContrastValue(value)
        break
    }
  }

  const applyChanges = async () => {
    if (!image.processedFile) return
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = new window.Image()
    img.src = processedURL
    await new Promise(resolve => img.onload = resolve)
    
    canvas.width = img.width
    canvas.height = img.height
    
    // Apply background
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else if (bgType === 'image' && customBgImage) {
      const bgImg = new window.Image()
      bgImg.src = URL.createObjectURL(customBgImage)
      await new Promise(resolve => bgImg.onload = resolve)
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
    } else if (bgType === 'pattern') {
      const pattern = predefinedPatterns.find(p => p.id === selectedPattern)
      if (pattern) {
        pattern.generate(canvas, bgColor)
      }
    }
    
    // Draw the processed image
    ctx.drawImage(img, 0, 0)
    
    // Apply effects
    if (selectedEffect !== 'none') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      switch (selectedEffect) {
        case 'blur':
          // Create a temporary canvas for blur effect
          const tempCanvas = document.createElement('canvas')
          const tempCtx = tempCanvas.getContext('2d')
          if (!tempCtx) break
          
          tempCanvas.width = canvas.width
          tempCanvas.height = canvas.height
          
          // Draw current state to temp canvas
          tempCtx.drawImage(canvas, 0, 0)
          
          // Clear main canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // Apply blur using CSS filter
          ctx.filter = `blur(${blurValue / 10}px)`
          ctx.drawImage(tempCanvas, 0, 0)
          ctx.filter = 'none'
          break
          
        case 'brightness':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * (brightnessValue / 50))
            data[i + 1] = Math.min(255, data[i + 1] * (brightnessValue / 50))
            data[i + 2] = Math.min(255, data[i + 2] * (brightnessValue / 50))
          }
          ctx.putImageData(imageData, 0, 0)
          break
          
        case 'contrast':
          const factor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue))
          for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128
            data[i + 1] = factor * (data[i + 1] - 128) + 128
            data[i + 2] = factor * (data[i + 2] - 128) + 128
          }
          ctx.putImageData(imageData, 0, 0)
          break
      }
    }
    
    const dataUrl = canvas.toDataURL('image/png')
    setExportUrl(dataUrl)
  }

  const handleSave = () => {
    onSave(exportUrl)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#181926] border border-[#23243a] shadow-xl rounded-xl max-w-2xl w-full animate-in fade-in">
        <div className="flex justify-between items-center p-4 border-b border-[#23243a]">
          <h2 className="text-xl font-semibold text-white">Edit Image</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-[#23243a] rounded-full"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-white mb-2">Background</h3>
              <Tabs value={bgType} onValueChange={setBgType} className="w-full">
                <TabsList className="grid w-full grid-cols-3 p-0 mb-2 bg-[#23243a]">
                  {backgroundOptions.map(option => (
                    <TabsTrigger
                      key={option.id}
                      value={option.id}
                      className="inline-flex items-center justify-center text-[13px] font-medium transition-all"
                    >
                      <span className="opacity-70">{option.icon}</span>
                      <span>{option.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="color">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {predefinedColors.map(color => (
                        <Button
                          key={color}
                          onClick={() => setBgColor(color)}
                          variant="outline"
                          size="icon"
                          className={`w-8 h-8 p-0 rounded-md transition-all
                            ${bgColor === color ? 'ring-2 ring-blue-500' : 'ring-1 ring-[#353657]'}
                          `}
                          style={{ backgroundColor: color }}
                          aria-label={`Color ${color}`}
                        />
                      ))}
                    </div>
                    <Button
                      onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
                      variant="outline"
                      size="sm"
                      className="bg-[#23243a] border-[#353657] text-gray-300 hover:bg-[#2a2b45]"
                    >
                      <Palette size={16} className="mr-1.5" />
                      Custom Color
                    </Button>
                    {showCustomColorPicker && (
                      <div className="mt-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-8 h-8 rounded"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="image">
                  <Button
                    variant="outline"
                    className="w-full bg-[#23243a] border-[#353657] text-gray-300 hover:bg-[#2a2b45] flex items-center justify-center"
                    onClick={() => document.getElementById('bg-image-upload')?.click()}
                  >
                    <Upload size={16} className="mr-1.5" />
                      Upload Image
                  </Button>
                  <input
                    id="bg-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCustomBgImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  {customBgImage && (
                    <p className="text-gray-300 text-sm mt-2 truncate">
                      {customBgImage.name}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="pattern">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {predefinedPatterns.map(pattern => (
                        <Button
                          key={pattern.id}
                          onClick={() => setSelectedPattern(pattern.id)}
                          variant={selectedPattern === pattern.id ? 'default' : 'outline'}
                          size="sm"
                          className={`px-2.5 py-1.5 text-sm ${
                            selectedPattern === pattern.id 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none shadow-md' 
                              : 'bg-[#23243a] text-gray-300 hover:bg-[#2a2b45] border-[#353657] hover:text-white'
                          }`}
                        >
                          <span>{pattern.icon}</span>
                          {pattern.label}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 mb-2">Pattern Color:</p>
                      <div className="flex flex-wrap gap-2">
                        {predefinedColors.map(color => (
                          <Button
                            key={color}
                            onClick={() => setBgColor(color)}
                            variant="outline"
                            size="icon"
                            className={`w-6 h-6 p-0 rounded-md transition-all
                              ${bgColor === color ? 'ring-2 ring-blue-500' : 'ring-1 ring-[#353657]'}
                            `}
                            style={{ backgroundColor: color }}
                            aria-label={`Pattern color ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <h3 className="font-medium text-white mb-2">Effects</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {effectOptions.map(option => (
                  <Button
                    key={option.id}
                    onClick={() => {
                      setSelectedEffect(option.id)
                      setEffectValue(getCurrentEffectValue())
                    }}
                    variant={selectedEffect === option.id ? 'default' : 'outline'}
                    size="sm"
                    className={`px-2.5 py-1.5 text-sm ${
                      selectedEffect === option.id 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none shadow-md' 
                        : 'bg-[#23243a] text-gray-300 hover:bg-[#2a2b45] border-[#353657] hover:text-white'
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </Button>
                ))}
              </div>

              {selectedEffect !== 'none' && (
                <div className="bg-[#23243a] rounded-md p-4 border border-[#353657]">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={getCurrentEffectValue()}
                    onChange={(e) => handleEffectValueChange(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>{getCurrentEffectValue()}</span>
                    <span>100</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-white mb-2">Preview</h3>
            <div className="bg-black rounded-md overflow-hidden relative h-64 flex items-center justify-center">
              <Image
                src={exportUrl || processedURL}
                alt="Preview"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#23243a] p-4 flex justify-end space-x-3">
          <Button
            variant="outline"
            size="lg"
            className="border-[#353657] text-gray-200 hover:bg-[#23243a]"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
