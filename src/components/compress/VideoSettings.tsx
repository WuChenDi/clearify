import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ConversionSettings } from '@/types'

interface VideoSettingsProps {
  settings: ConversionSettings
  // eslint-disable-next-line no-unused-vars
  onSettingsChange: (settings: ConversionSettings) => void
  open: boolean
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void
}

export default function VideoSettings({
  settings,
  onSettingsChange,
  open,
  onOpenChange,
}: VideoSettingsProps) {
  const handleSettingChange = (
    key: keyof ConversionSettings,
    value: string,
  ) => {
    console.log(key, value)
    onSettingsChange({ ...settings, [key]: value })
  }

  const renderCompressionControl = () => {
    switch (settings.compressionMethod) {
      case 'percentage':
        return (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Target Quality Percentage
            </label>
            <Input
              type="range"
              min="1"
              max="100"
              value={settings.targetPercentage || '100'}
              onChange={(e) =>
                handleSettingChange('targetPercentage', e.target.value)
              }
              className="mt-1 block w-full"
            />
            <div className="mt-1 text-sm text-gray-500">
              {settings.targetPercentage || '100'}% quality
            </div>
          </div>
        )
      case 'filesize':
        return (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Target File Size (MB)
            </label>
            <Input
              type="number"
              min="1"
              max="10240"
              value={settings.targetFilesize || '100'}
              onChange={(e) =>
                handleSettingChange('targetFilesize', e.target.value)
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        )
      case 'crf':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Video Quality (CRF)
            </label>
            <Select
              value={settings.crfValue || '23'}
              onValueChange={(value) => handleSettingChange('crfValue', value)}
            >
              <SelectTrigger className="bg-card/50 border border-border w-full rounded-md p-2 focus:ring-2 focus:ring-blue-400">
                <SelectValue placeholder="Select a quality" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/90 rounded-md">
                {Array.from({ length: 34 }, (_, i) => i + 18).map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}{' '}
                    {value === 18
                      ? '(Best Quality)'
                      : value === 51
                        ? '(Smallest Size)'
                        : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'bitrate':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Video Bitrate
            </label>
            <Select
              value={settings.videoBitrate}
              onValueChange={(value) =>
                handleSettingChange('videoBitrate', value)
              }
            >
              <SelectTrigger className="bg-card/50 border border-border w-full rounded-md p-2 focus:ring-2 focus:ring-blue-400">
                <SelectValue placeholder="Select a bitrate" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/90 rounded-md">
                <SelectItem value="300k">300 Kbps</SelectItem>
                <SelectItem value="1000k">1 Mbps</SelectItem>
                <SelectItem value="2500k">2.5 Mbps</SelectItem>
                <SelectItem value="5000k">5 Mbps</SelectItem>
                <SelectItem value="8000k">8 Mbps</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Conversion Settings</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Compression Method
            </label>
            <Select
              value={settings.compressionMethod}
              onValueChange={(value) =>
                handleSettingChange('compressionMethod', value)
              }
            >
              <SelectTrigger className="bg-card/50 border border-border w-full rounded-md p-2 focus:ring-2 focus:ring-blue-400">
                <SelectValue placeholder="Select a method" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/90 rounded-md">
                <SelectItem value="percentage">
                  Target a quality percentage
                </SelectItem>
                <SelectItem value="filesize">
                  Target a file size (MB)
                </SelectItem>
                <SelectItem value="crf">
                  Target a video quality (CRF)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">{renderCompressionControl()}</div>

          <div>
            <label className="text-sm font-medium text-foreground/80">
              Video Codec
            </label>
            <Select
              value={settings.videoCodec}
              onValueChange={(value) =>
                handleSettingChange('videoCodec', value)
              }
            >
              <SelectTrigger className="bg-card/50 border border-border w-full rounded-md p-2 focus:ring-2 focus:ring-blue-400">
                <SelectValue placeholder="Select a codec" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/90 rounded-md">
                <SelectItem value="libx264">H.264</SelectItem>
                <SelectItem value="libx265">H.265</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/80">
              Audio Codec
            </label>
            <Select
              value={settings.audioCodec}
              onValueChange={(value) =>
                handleSettingChange('audioCodec', value)
              }
            >
              <SelectTrigger className="bg-card/50 border border-border w-full rounded-md p-2 focus:ring-2 focus:ring-blue-400">
                <SelectValue placeholder="Select a codec" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/90 rounded-md">
                <SelectItem value="aac">AAC</SelectItem>
                <SelectItem value="mp3">MP3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/80">
              Audio Bitrate
            </label>
            <Select
              value={settings.audioBitrate}
              onValueChange={(value) =>
                handleSettingChange('audioBitrate', value)
              }
            >
              <SelectTrigger className="bg-card/50 border border-border w-full rounded-md p-2 focus:ring-2 focus:ring-blue-400">
                <SelectValue placeholder="Select a bitrate" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/90 rounded-md">
                <SelectItem value="64k">64 kbps</SelectItem>
                <SelectItem value="96k">96 kbps</SelectItem>
                <SelectItem value="128k">128 kbps</SelectItem>
                <SelectItem value="192k">192 kbps</SelectItem>
                <SelectItem value="256k">256 kbps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/80">
              Frame Rate
            </label>
            <Select
              value={settings.frameRate}
              onValueChange={(value) => handleSettingChange('frameRate', value)}
            >
              <SelectTrigger className="bg-card/50 border border-border w-full rounded-md p-2 focus:ring-2 focus:ring-blue-400">
                <SelectValue placeholder="Select a frame rate" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/90 rounded-md">
                <SelectItem value="24">24 fps</SelectItem>
                <SelectItem value="30">30 fps</SelectItem>
                <SelectItem value="60">60 fps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/80">
              Max Resolution
            </label>
            <Select
              value={settings.resolution}
              onValueChange={(value) =>
                handleSettingChange('resolution', value)
              }
            >
              <SelectTrigger className="bg-card/50 border border-border w-full rounded-md p-2 focus:ring-2 focus:ring-blue-400">
                <SelectValue placeholder="Select a resolution" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/90 rounded-md">
                <SelectItem value="1920x1080">1080p (1920px)</SelectItem>
                <SelectItem value="1280x720">720p (1280px)</SelectItem>
                <SelectItem value="854x480">480p (854px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
