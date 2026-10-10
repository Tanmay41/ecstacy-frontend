'use client'

import { useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'

function formatUptime(startedAt: string): string {
  const ms = Date.now() - new Date(startedAt).getTime()
  const mins = Math.floor(ms / 60000)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) return `${hrs}h ${mins % 60}m`
  if (mins > 0) return `${mins}m`
  return '<1m'
}
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import SessionDetail from '@/components/admin/SessionDetail'

interface SessionUser {
  _id: string
  username: string
  email: string
  role: string
  status: string
  hwid?: string
}

interface ActiveMenuSession {
  id: string
  type: 'menu'
  user: SessionUser | null
  ip: string
  sessionId: string
  launchTokenPreview: string
  hwid: string
  productSlug: string
  startedAt: string
  lastHeartbeat: string
  valid: boolean
  endedAt: string | null
  createdAt: string
  heartbeatAge: number
  isStale: boolean
}

interface ActiveWebSession {
  id: string
  type: 'access' | 'loader'
  user: SessionUser | null
  ip: string
  userAgent: string
  token: string
  expiresAt: string
  createdAt: string
}

type AnySession = ActiveMenuSession | ActiveWebSession

export default function SessionsPage() {
  const { user: me } = useAuth()
  const isOwner = me?.role === 'owner'

  const [menuSessions, setMenuSessions] = useState<ActiveMenuSession[]>([])
  const [webSessions, setWebSessions] = useState<ActiveWebSession[]>([])
  const [loaderSessions, setLoaderSessions] = useState<ActiveWebSession[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'menu' | 'web' | 'loader'>('menu')
  const [selected, setSelected] = useState<AnySession | null>(null)
  const [live, setLive] = useState(false)

  const applySessions = useCallback((data: Partial<{ menu: ActiveMenuSession[]; web: ActiveWebSession[]; loader: ActiveWebSession[] }>) => {
    if (data.menu) setMenuSessions(data.menu)
    if (data.web) setWebSessions(data.web)
    if (data.loader) setLoaderSessions(data.loader)
    setLoading(false)
  }, [])

  const fetchSessions = useCallback(() => {
    setLoading(true)
    api.get('/sessions/active').then((r) => {
      applySessions(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [applySessions])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    const url = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '')
    const socket = io(url, { auth: { token } })

    socket.on('connect', () => setLive(true))
    socket.on('disconnect', () => setLive(false))
    socket.on('connect_error', () => setLive(false))
    socket.on('sessions:update', applySessions)

    return () => { socket.disconnect() }
  }, [applySessions])

  useEffect(() => {
    if (live) return
    const interval = setInterval(fetchSessions, 15000)
    return () => clearInterval(interval)
  }, [live, fetchSessions])

  if (!isOwner) return <p className="text-muted-foreground">Access denied.</p>

  const activeSessions = tab === 'menu' ? menuSessions
    : tab === 'web' ? webSessions
    : loaderSessions

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Active Sessions</h1>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${
            live ? 'text-green-400' : 'text-yellow-400'
          }`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${live ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            {live ? 'Live' : 'Polling'}
          </span>
          <Button size="sm" variant={tab === 'menu' ? 'default' : 'outline'} onClick={() => setTab('menu')}>
            Menu ({menuSessions.length})
          </Button>
          <Button size="sm" variant={tab === 'web' ? 'default' : 'outline'} onClick={() => setTab('web')}>
            Web ({webSessions.length})
          </Button>
          <Button size="sm" variant={tab === 'loader' ? 'default' : 'outline'} onClick={() => setTab('loader')}>
            Loader ({loaderSessions.length})
          </Button>
          <Button size="sm" variant="outline" onClick={fetchSessions} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : activeSessions.length === 0 ? (
        <p className="text-muted-foreground">No active {tab} sessions.</p>
      ) : tab === 'menu' ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-muted-foreground">HWID</th>
                <th className="px-4 py-3 text-left text-muted-foreground">IP</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Started</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Heartbeat</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Uptime</th>
              </tr>
            </thead>
            <tbody>
              {menuSessions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelected(s)}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-foreground truncate max-w-[120px]">{s.user?.username || '—'}</span>
                      {s.user && <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{s.user.email}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
                    <span title={s.hwid}>{s.hwid ? `${s.hwid.substring(0, 12)}...` : '—'}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{s.ip || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.productSlug || '—'}</td>
                  <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(s.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${
                      s.heartbeatAge < 30 ? 'text-green-400' :
                      s.heartbeatAge < 120 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                        s.heartbeatAge < 30 ? 'bg-green-400' :
                        s.heartbeatAge < 120 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      {s.heartbeatAge}s
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatUptime(s.startedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-muted-foreground">IP</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Expires</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelected(s)}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-foreground truncate max-w-[120px]">{s.user?.username || '—'}</span>
                      {s.user && <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{s.user.email}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px] capitalize">{s.type}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{s.ip || '—'}</td>
                  <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">
                    {'expiresAt' in s ? new Date(s.expiresAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null) }}>
        {selected && (
          <DialogContent
            showCloseButton={false}
            className="!max-w-none !w-auto !p-0 !bg-transparent !ring-0 !rounded-none"
          >
            <SessionDetail session={selected} onClose={() => setSelected(null)} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}


