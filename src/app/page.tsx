import { ArrowRight, Image, Video, Sparkles, FireExtinguisher } from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import GradientText from '@/components/reactbits/GradientText'
import ShinyText from '@/components/reactbits/ShinyText'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Task {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  route: string;
}

const tasks: Task[] = [
  {
    id: 'remove-background',
    title: 'Remove Image Background',
    subtitle: 'AI-powered background removal',
    description:
      'Instantly remove backgrounds from any image using advanced AI. Perfect for portraits, product photos, and creating transparent images.',
    icon: Image,
    color: 'bg-gradient-to-r from-purple-500 to-blue-500',
    route: '/bg'
  },
  {
    id: 'squish',
    title: 'Image Squish',
    subtitle: 'Smart image compression',
    description:
    'Compress images up to 90% while maintaining quality. Fast browser-based processing with support for multiple formats including JPEG, PNG, and WebP.',
    icon: FireExtinguisher,
    color: 'bg-gradient-to-r from-orange-500 to-red-500',
    route: '/squish'
  },
  {
    id: 'compress',
    title: 'Video Compress',
    subtitle: 'Efficient video compression',
    description: 'Reduce video file sizes by up to 90% without quality loss. Fast browser-based compression with no uploads required.',
    icon: Video,
    color: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    route: '/compress'
  }
]

export default function Home() {
  return (
    <div className="w-full max-w-4xl space-y-12 relative">
      <div className="text-center mb-8">
        <GradientText className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r">
          Clearify
        </GradientText>
        <div className="mt-6">
          <ShinyText 
            text="Powerful web-based tools for your image editing needs" 
            disabled={false} 
            speed={3} 
            className='text-base md:text-lg text-gray-600 dark:text-gray-300'
          />
        </div>
        <div className="mt-4 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400">All images are processed locally on your device and are not uploaded to any server.</span>
        </div>
      </div>
        
      {/* Modified grid to center a single card */}
      <div className="flex justify-center">
        <div className={`grid grid-cols-1 gap-8 ${tasks.length > 1 ? 'md:grid-cols-2 w-full' : 'max-w-md w-full'}`}>
          {tasks.map((task) => (
            <div 
              key={task.id}
              className="group relative"
            >
              <Card className="relative border-none bg-card/30 backdrop-blur-xl shadow-lg rounded-xl overflow-hidden h-full transition-all duration-300 group-hover:translate-y-[-4px]">
                <CardHeader className="border-b border-border/30">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${task.color} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      <task.icon size={22} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold tracking-tight">
                        {task.title}
                      </CardTitle>
                      {
                        task.subtitle && (
                          <CardDescription className="text-sm mt-1">{task.subtitle}</CardDescription>
                        )
                      }
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  <p className="text-muted-foreground">{task.description}</p>
                  <div className="mt-auto pt-6">
                    <Link href={task.route} passHref>
                      <Button 
                        className={`w-full ${task.color} border-none text-white font-medium shadow-md transition-all duration-300 group-hover:shadow-lg cursor-pointer`}
                      >
                        <span className="mr-2">Try it now</span>
                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
