'use client'

import { Github, ExternalLinkIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="w-full z-10">
      <div className="container mx-auto">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="https://notes-wudi.pages.dev/images/logo.png"
                alt="Chendi Wu Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-white font-medium">Clearify</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Link href="https://cctts.pages.dev/" className="text-white hover:text-gray-200 transition-colors flex items-center gap-1">
                CCTTS
                <ExternalLinkIcon className="w-4 h-4" />
              </Link>
            </nav>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                asChild
                variant="outline"
                size="icon"
                aria-label="GitHub"
              >
                <a
                  href="https://github.com/WuChenDi"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-5 h-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
