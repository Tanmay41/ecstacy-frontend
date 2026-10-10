'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import type { Key } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiDownloadLine, RiCheckLine, RiCloseLine } from '@remixicon/react'

export default function DownloadPage() {
  const { user } = useAuth()
  const [keys, setKeys] = useState<Key[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/keys').then((r) => {
      if (r.data.keys) setKeys(r.data.keys as Key[])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const activeKey = keys.find(
    (k) => k.status === 'active' && (!k.expiresAt || new Date(k.expiresAt) > new Date()),
  )

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    setError('')
    try {
      const r = await api.get('/loader/download/loader.exe', {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'ecstacy-loader.exe'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Download failed. Check your license and try again.'
      setError(msg)
    } finally {
      setDownloading(false)
    }
  }, [])

  if (!user) return null

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Download Loader</h1>

      {/* License Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            License Status
            {loading ? null : activeKey ? (
              <Badge variant="default" className="gap-1">
                <RiCheckLine className="h-3 w-3" /> Active
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <RiCloseLine className="h-3 w-3" /> No Active License
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Checking license...</p>
          ) : activeKey ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your <span className="font-medium text-foreground capitalize">{activeKey.type}</span> license
                is active{activeKey.expiresAt ? ` until ${new Date(activeKey.expiresAt).toLocaleDateString()}` : ''}.
              </p>
              <Button onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <RiDownloadLine className="mr-2 h-4 w-4" />
                )}
                {downloading ? 'Downloading...' : 'Download ecstacy-loader.exe'}
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You need an active license to download the loader.
              </p>
              <p className="text-sm text-muted-foreground">
                Visit the <a href="/dashboard/keys" className="text-primary hover:underline">Keys page</a> to purchase or activate a license key.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="ml-4 list-decimal space-y-2 text-sm text-muted-foreground">
            <li>Download the loader using the button above.</li>
            <li>Run <span className="font-mono text-foreground">ecstacy-loader.exe</span> on your Windows PC.</li>
            <li>Log in with your <span className="font-medium text-foreground">{user.username}</span> account credentials.</li>
            <li>The loader will automatically download and launch the latest menu version.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
