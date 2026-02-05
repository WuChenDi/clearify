import type React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function PageContainer({
  children,
  scrollable = true,
  className,
}: {
  children: React.ReactNode
  scrollable?: boolean
  className?: string
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className="h-[calc(100dvh-80px)]">
          <main className={cn('flex flex-1 p-4 md:px-6 pt-0', className)}>
            {children}
          </main>
        </ScrollArea>
      ) : (
        <main className={cn('flex flex-1 p-4 md:px-6 pt-0', className)}>
          {children}
        </main>
      )}
    </>
  )
}
