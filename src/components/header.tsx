'use client'

import { Github } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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
              {'Clearify'.split('').map((letter, index) => {
                return (
                  <span
                    key={index}
                    className='hover:text-fun-pink hover:-mt-2 transition-all duration-500 hover:duration-100 click:goodbyeLetterAnim text-white font-medium'
                  >
                    {letter}
                  </span>
                )
              })}
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="icon"
                aria-label="GitHub"
              >
                <Link
                  href="https://github.com/WuChenDi/clearify"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
