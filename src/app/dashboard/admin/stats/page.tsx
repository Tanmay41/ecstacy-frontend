'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { AdminStats } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function StatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then((r) => {
      setStats(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted-foreground">Loading...</p>
  if (!stats) return <p className="text-muted-foreground">Failed to load stats</p>

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard Stats</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Active (7d)" value={stats.activeUsers} />
        <StatCard label="Suspended" value={stats.suspendedUsers} />
        <StatCard label="Banned" value={stats.bannedUsers} />
        <StatCard label="Total Keys" value={stats.totalKeys} />
        <StatCard label="Active Keys" value={stats.activeKeys} />
        <StatCard label="Used Keys" value={stats.usedKeys} />
        <StatCard label="Expired Keys" value={stats.expiredKeys} />
        <StatCard label="New Users (7d)" value={stats.newUsersThisWeek} />
        <StatCard label="Downloads (30d)" value={stats.downloadsThisMonth} />
        <StatCard label="Keys (30d)" value={stats.keysGeneratedThisMonth} />
        <StatCard label="Revenue" value={stats.revenueThisMonth} prefix="$" />
      </div>
    </div>
  )
}

function StatCard({ label, value, prefix = '' }: { label: string; value: number; prefix?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-bold text-foreground">{prefix}{value.toLocaleString()}</p></CardContent>
    </Card>
  )
}
