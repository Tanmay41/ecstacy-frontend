'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import type { ApiResponse, AdminStats, Key, Product } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [keys, setKeys] = useState<Key[]>([])

  useEffect(() => {
    if (!user) return
    if (user.role === 'owner') {
      api.get<ApiResponse>('/admin/stats').then((r) => {
        if (r.data.stats) setStats(r.data.stats)
      }).catch(() => {})
      api.get<ApiResponse>('/keys').then((r) => {
        if (r.data.keys) setKeys(r.data.keys)
      }).catch(() => {})
    } else if (user.role === 'customer') {
      api.get<ApiResponse>('/keys').then((r) => {
        if (r.data.keys) setKeys(r.data.keys)
      }).catch(() => {})
    } else {
      api.get<ApiResponse>('/admin/stats').then((r) => {
        if (r.data.stats) setStats(r.data.stats)
      }).catch(() => {})
    }
  }, [user])

  if (!user) return null

  if (user.role === 'owner') {
    const activeKeys = keys.filter((k) => k.status === 'active')
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Overview</h1>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Users" value={stats?.totalUsers ?? '—'} />
          <StatCard label="Active Users" value={stats?.activeUsers ?? '—'} />
          <StatCard label="Total Keys" value={stats?.totalKeys ?? '—'} />
          <StatCard label="Active Keys" value={activeKeys.length} />
        </div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Recent Keys</h2>
        <KeyTable keys={keys.slice(0, 10)} />
      </div>
    )
  }

  if (user.role === 'admin') {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Overview</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Users" value={stats?.totalUsers ?? '—'} />
          <StatCard label="Active Users" value={stats?.activeUsers ?? '—'} />
          <StatCard label="Suspended" value={stats?.suspendedUsers ?? '—'} />
          <StatCard label="Total Keys" value={stats?.totalKeys ?? '—'} />
        </div>
      </div>
    )
  }

  const products = Array.from(
    new Map(
      keys
        .filter((k) => k.product && typeof k.product === 'object')
        .map((k) => [(k.product as Product).slug, k.product as Product])
    ).values()
  )

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Overview</h1>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Account Status</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold text-green-400">{user.status}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">License Key</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">{keys[0] ? keys[0].keyValue : 'No key'}</p>
            <p className="text-xs text-muted-foreground">{keys[0]?.type || ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Key Status</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${keys[0]?.status === 'active' ? 'text-green-400' : 'text-muted-foreground'}`}>
              {keys[0]?.status || '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {products.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Your Products</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.slug}>
                <CardHeader><CardTitle className="text-foreground">{p.name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{p.slug} &middot; {p.type}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {keys.length > 1 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">All Keys</h2>
          <KeyTable keys={keys} />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-bold text-foreground">{value}</p></CardContent>
    </Card>
  )
}

function KeyTable({ keys }: { keys: Key[] }) {
  if (keys.length === 0) return <p className="text-muted-foreground">No keys found</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted">
            <th className="px-4 py-3 text-left text-muted-foreground">Key</th>
            <th className="px-4 py-3 text-left text-muted-foreground">Type</th>
            <th className="px-4 py-3 text-left text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left text-muted-foreground">Created</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-4 py-3 font-mono text-xs text-foreground">{k.keyValue}</td>
              <td className="px-4 py-3 text-muted-foreground">{k.type}</td>
              <td className="px-4 py-3"><Badge variant={k.status === 'active' ? 'default' : k.status === 'used' ? 'secondary' : 'outline'}>{k.status}</Badge></td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(k.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
