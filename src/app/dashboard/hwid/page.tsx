'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
      <Card className="max-w-md">
        <CardHeader><CardTitle className="text-sm text-muted-foreground">Your HWID</CardTitle></CardHeader>
        <CardContent>
          <p className="break-all font-mono text-sm text-foreground">{loading ? 'Loading...' : hwid || 'No HWID set'}</p>
          {!hwid && !loading && <p className="mt-3 text-sm text-muted-foreground">Your HWID will appear here after you run the loader for the first time.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
