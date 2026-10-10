'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import type { User, Key } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [target, setTarget] = useState<User | null>(null)
  const [keys, setKeys] = useState<Key[]>([])
  const [loading, setLoading] = useState(true)

  const isOwner = user?.role === 'owner'
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get(`/users/${id}`).then((r) => setTarget(r.data.user || null)),
      api.get(`/keys?owner=${id}`).then((r) => setKeys(r.data.keys || [])),
    ]).catch(() => router.push('/dashboard/users')).finally(() => setLoading(false))
  }, [id, router])

  async function toggleStatus(newStatus: string) {
    try {
      await api.patch(`/users/${id}/status`, { status: newStatus })
      setTarget((prev) => prev ? { ...prev, status: newStatus as User['status'] } : prev)
    } catch { /* ignore */ }
  }

  async function resetHwid() {
    try {
      await api.post(`/hwid/admin-reset/${id}`, { reason: 'Manual reset by owner' })
    } catch { /* ignore */ }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>
  if (!target) return <p className="text-muted-foreground">User not found</p>

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default' as const
      case 'used': return 'secondary' as const
      case 'expired': return 'outline' as const
      default: return 'destructive' as const
    }
  }

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 text-sm text-muted-foreground hover:text-foreground">← Back</button>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{target.username}</h1>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Email</CardTitle></CardHeader><CardContent><p className="text-foreground">{target.email}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Role</CardTitle></CardHeader><CardContent><p className="text-foreground capitalize">{target.role}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Status</CardTitle></CardHeader><CardContent><p className="text-foreground capitalize">{target.status}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">HWID</CardTitle></CardHeader><CardContent><p className="break-all font-mono text-xs text-foreground">{target.hwid || 'Not set'}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Last Login</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{target.lastLogin ? new Date(target.lastLogin).toLocaleString() : 'Never'}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Created</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{new Date(target.createdAt).toLocaleDateString()}</p></CardContent></Card>
      </div>
      {isOwner || isAdmin ? (
        <div className="mb-8 flex flex-wrap gap-3">
          {target.role !== 'owner' && target.status !== 'banned' && (
            <Button
              variant={target.status === 'suspended' ? 'default' : 'outline'}
              onClick={() => toggleStatus('suspended')}
              disabled={isAdmin && target.status === 'suspended'}
            >
              {target.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
            </Button>
          )}
          {target.role !== 'owner' && target.status !== 'banned' && (
            <Button variant="destructive" onClick={() => toggleStatus('banned')}>
              Ban
            </Button>
          )}
          {target.status === 'banned' && target.role !== 'owner' && isOwner && (
            <Button variant="outline" onClick={() => toggleStatus('active')}>
              Unban
            </Button>
          )}
          {isOwner && target.hwid && (
            <Button variant="secondary" onClick={resetHwid}>
              Reset HWID
            </Button>
          )}
        </div>
      ) : null}
      <h2 className="mb-3 text-lg font-semibold text-foreground">Keys</h2>
      {keys.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-muted-foreground">Key</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-border">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{k.keyValue}</td>
                  <td className="px-4 py-3 text-muted-foreground">{k.type}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant(k.status)}>{k.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-muted-foreground">No keys for this user</p>}
    </div>
  )
}
