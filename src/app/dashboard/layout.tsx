'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import DarkVeil from '@/components/DarkVeil'
import { Toaster } from '@/components/ui/sonner'

function LoadingShell() {
  return (
    <div className="relative z-0 flex h-screen">
      <div className="fixed inset-0 -z-10">
        <DarkVeil hueShift={70} noiseIntensity={0.08} speed={0.5} warpAmount={1} />
      </div>
      <div className="hidden w-56 shrink-0 border-r border-border bg-sidebar/60 backdrop-blur-2xl md:block">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <span className="text-xl text-primary">✦</span>
          <span className="text-lg font-bold text-foreground">ecstacy</span>
        </div>
        <div className="space-y-2 p-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden bg-background/60 backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-border bg-background/80 px-6 py-3">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-8 w-24 rounded-lg" />
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="skeleton mb-6 h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!loading && !user && mounted) {
      router.push('/login')
    }
  }, [user, loading, mounted, router])

  if (!mounted || loading) return <LoadingShell />

  if (!user) return null

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
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div key={pathname} className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
