'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiMacbookLine, RiInformationLine, RiRefreshLine } from '@remixicon/react'
import CopyButton from '@/components/CopyButton'

export default function HwidPage() {
  const { user } = useAuth()
  const [hwid, setHwid] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/hwid/me').then((r) => {
      setHwid(r.data.hwid || '')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (!user) return null

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">HWID</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <RiMacbookLine size={16} />
              Your Hardware ID
              {hwid && !loading && <Badge variant="default">Bound</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="skeleton h-6 w-full max-w-md" />
            ) : hwid ? (
              <div className="flex items-start gap-2">
                <p className="break-all font-mono text-xs leading-relaxed text-foreground">{hwid}</p>
                <CopyButton text={hwid} />
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">No HWID bound yet.</p>
                <p className="mt-2 text-xs text-muted-foreground/60">
                  Your HWID is automatically bound the first time you log in through the loader.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <RiInformationLine size={16} />
              About HWID Locking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your license is locked to this hardware fingerprint (disk serial, CPU ID, and machine GUID).
              This prevents your key from being shared across multiple PCs.
            </p>
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                <RiRefreshLine size={14} className="text-primary" />
                Need a HWID reset?
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                If you changed hardware (new motherboard, drive, etc.), open a ticket in our Discord
                and an admin will reset your HWID binding. You&apos;ll then re-bind on your next loader login.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
