'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: 'border-border bg-popover text-popover-foreground shadow-lg',
      }}
      closeButton
      richColors
    />
  )
}
