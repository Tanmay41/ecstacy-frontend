'use client'

import { useState, useCallback } from 'react'
import { RiFileCopyLine, RiCheckLine } from '@remixicon/react'
import { toast } from 'sonner'

export default function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Failed to copy')
    }
  }, [text])

  return (
    <button
      onClick={(e) => { e.stopPropagation(); copy() }}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <RiCheckLine size={13} className="text-green-400" /> : <RiFileCopyLine size={13} />}
    </button>
  )
}
