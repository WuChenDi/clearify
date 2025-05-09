import { GoogleAnalytics } from '@next/third-parties/google'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import Footer from '@/components/footer'
import Header from '@/components/header'
import Aurora from '@/components/reactbits/Aurora'
import Particles from '@/components/reactbits/Particles'
import SplashCursor from '@/components/reactbits/SplashCursor'

import { Providers } from './providers'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

// 背景效果组件
const BackgroundEffects = () => (
  <>
    <div className="fixed inset-0">
      <Aurora
        colorStops={['#4C00FF', '#97FFF4', '#FF3D9A']}
        blend={3.3}
        amplitude={0.3}
        speed={1.3}
      />
    </div>
    <div className="fixed inset-0">
      <Particles
        particleColors={['#ffffff', '#ffffff']}
        particleCount={400}
        particleSpread={10}
        speed={0.05}
        particleBaseSize={100}
        moveParticlesOnHover={false}
        alphaParticles={false}
        disableRotation={false}
      />
    </div>
    <SplashCursor />
  </>
)

export const metadata: Metadata = {
  title: 'Clearify',
  icons: 'https://notes-wudi.pages.dev/images/logo.png',
  description: 'Powerful web-based tools for your image editing needs',
  keywords: [
    'image editing',
    'background removal',
    'AI tools',
    'photo editing',
    'online image editor',
    'Clearify',
    'web-based image tools',
    'free image editor',
    'AI image processing',
    'image enhancement'
  ],
  referrer: 'no-referrer-when-downgrade',
  authors: [{ name: 'wudi' }],
  robots: { index: true, follow: true },
  metadataBase: new URL('https://clearify.pages.dev/'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Clearify',
    description: 'Powerful web-based tools for your image editing needs',
    url: '/',
    siteName: 'Clearify',
    images: [
      {
        url: 'https://cdn.jsdelivr.net/gh/cdLab996/picture-lib/wudi/Clearify/index.png'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clearify',
    description: 'Powerful web-based tools for your image editing needs',
    images: ['https://cdn.jsdelivr.net/gh/cdLab996/picture-lib/wudi/Clearify/index.png'],
    site: '@wuchendi96',
    creator: '@wuchendi96'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className={inter.className}>
        <Providers>
          <BackgroundEffects />
          <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
            <Header />
            <div className="container mx-auto px-4 py-12 flex flex-col items-center flex-1">
              {children}
            </div>
            <Footer />
            <Toaster 
              richColors
              position="top-right"
              duration={3000}
            />
          </main>
        </Providers>
      </body>
      <GoogleAnalytics gaId="G-SQ7T70ZV18" />
    </html>
  )
}
