import { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import { Providers } from '@/app/providers'
import Footer from '@/components/footer'
import Header from '@/components/header'
import Aurora from '@/components/reactbits/Aurora'
import Particles from '@/components/reactbits/Particles'
import SplashCursor from '@/components/reactbits/SplashCursor'

import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

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

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Providers>
        <BackgroundEffects />
        <main className={`${inter.className} flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white`}>
          <Header />
          {/* Main content container */}
          <div className="container mx-auto px-4 py-12 flex flex-col items-center flex-1">

            {/* Main content area */}
            <Component {...pageProps} />
          </div>

          <Footer />
          <Toaster 
            richColors
            position="top-right"
            duration={3000}
          />
        </main>
      </Providers>
    </>
  )
}
