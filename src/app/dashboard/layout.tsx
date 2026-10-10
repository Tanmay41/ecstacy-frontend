'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import DarkVeil from '@/components/DarkVeil'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!loading && !user && mounted) {
      router.push('/login')
    }
  }, [user, loading, mounted, router])

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  // Full-screen ban overlay — cold, final message
  if (user.status === 'banned') {
    return (
      <div className="relative z-0 flex h-screen items-center justify-center bg-background">
        <div className="fixed inset-0 -z-10">
          <DarkVeil hueShift={0} noiseIntensity={0.12} speed={0.3} warpAmount={0.5} />
        </div>
        <div className="text-center">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
            <span className="text-2xl text-red-400">!</span>
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">You are banned</h1>
          <p className="text-lg text-muted-foreground">The decision is final.</p>
          {user.banReason && (
            <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground/60">{user.banReason}</p>
          )}
          <div className="mt-10">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => { await logout(); window.location.href = '/login' }}
            >
              Sign Out
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="relative z-0 flex h-screen">
      <div className="fixed inset-0 -z-10">
        <DarkVeil hueShift={70} noiseIntensity={0.08} speed={0.5} warpAmount={1} />
      </div>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden bg-background/60 backdrop-blur-2xl">
        <header className="flex items-center justify-end border-b border-border bg-background/80 px-6 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => { await logout(); window.location.href = '/login' }}
          >
            Sign Out
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
