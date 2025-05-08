import { GoogleAnalytics } from '@next/third-parties/google'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Providers } from './providers'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

// --- SEO Metadata ---
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
          {children}
        </Providers>
      </body>
      <GoogleAnalytics gaId="G-SQ7T70ZV18" />
    </html>
  )
}
