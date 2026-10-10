'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import type { Screenshot } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import ForensicEventDetail from '@/components/admin/ForensicEventDetail'
import { X } from 'lucide-react'
import { toast } from 'sonner'

function getCtx(ctx: Record<string, unknown> | undefined, key: string): unknown {
  return ctx ? ctx[key] : undefined
}

const statusVariant = (s: string) => {
  switch (s) {
    case 'pending': return 'default' as const
    case 'reviewed': return 'outline' as const
    case 'dismissed': return 'secondary' as const
    default: return 'default' as const
  }
}

export default function ForensicPage() {
  const { user: me } = useAuth()
  const isOwner = me?.role === 'owner'

  const [events, setEvents] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Screenshot | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const fetchEvents = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ trigger: 'forensic', limit: '50' })
    if (statusFilter) params.set('status', statusFilter)
    api.get(`/screenshots?${params}`).then((r) => {
      if (r.data.screenshots) setEvents(r.data.screenshots)
    }).catch(() => { }).finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  async function handleReview(id: string, action?: string) {
    setActionLoading(id)
    try {
      await api.patch(`/screenshots/${id}/review`, action ? { action } : {})
      setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: 'reviewed' as Screenshot['status'] } : e))
      setSelected((prev) => prev?.id === id ? { ...prev, status: 'reviewed' as Screenshot['status'] } : prev)
      toast.success(action ? `Action taken: ${action}` : 'Marked reviewed')
    } catch {
      toast.error('Failed to process')
    } finally {
      setActionLoading(null)
    }
  }

  if (!isOwner) return <p className="text-muted-foreground">Access denied.</p>

  return (
    <div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Security Events</h1>
        <div className="flex items-center gap-2">
          {['', 'pending', 'reviewed', 'dismissed'].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
            >
              {s || 'All'}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground">No security events.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-muted-foreground">Event</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Source</th>
                <th className="px-4 py-3 text-left text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-muted-foreground">HWID</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Discord</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Time</th>
                <th className="px-4 py-3 text-right text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const ctx = ev.context || {}
                const eventType = getCtx(ctx, 'eventType') as string || ev.trigger
                const source = getCtx(ctx, 'source') as string || ''
                const hwid = getCtx(ctx, 'hwid') as string || ''
                const discord = getCtx(ctx, 'discord_accounts') as Array<{ id: string; username?: string }> | undefined
                const details = getCtx(ctx, 'details') as string || ''
                const extra = getCtx(ctx, 'extra') as string || ''
                const userId = ev.userId
                const username = typeof userId === 'object' && userId ? (userId as { username?: string }).username || '' : ''

                return (
                  <tr
                    key={ev.id}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelected(ev)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-foreground">{eventType}</span>
                      {details && <p className="mt-0.5 text-[10px] text-muted-foreground truncate max-w-[120px]">{details}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{source || '—'}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{username || '—'}</td>
                    <td className="px-4 py-3">
                      {hwid ? (
                        <span className="font-mono text-[10px] text-muted-foreground" title={hwid}>
                          {hwid.substring(0, 12)}...
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {discord && discord.length > 0 ? (
                        <span className="text-xs text-muted-foreground">{discord.length} found</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(ev.status)} className="text-[10px]">{ev.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(ev.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ev.status === 'pending' && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); handleReview(ev.id) }} disabled={actionLoading === ev.id}>
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null) }}>
        {selected && (
          <DialogContent
            showCloseButton={false}
            className="!max-w-none !w-auto !p-0 !bg-transparent !ring-0 !rounded-none"
          >
            <ForensicEventDetail
              event={selected}
              onClose={() => setSelected(null)}
              onAction={(action) => {
                const actionPayload = action === 'review' ? undefined : action
                handleReview(selected.id, actionPayload)
              }}
              onImageClick={(data) => setLightboxImage(data)}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* independent image lightbox — portal to body so it stacks above dialog */}
      {lightboxImage && typeof document === 'object' && createPortal(
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(16px) saturate(140%)',
            WebkitBackdropFilter: 'blur(16px) saturate(140%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fafafa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10,
            }}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={`data:image/jpeg;base64,${lightboxImage}`}
            alt="Report image"
            style={{
              display: 'block',
              maxWidth: '95vw', maxHeight: '90vh',
              width: 'auto', height: 'auto',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              userSelect: 'none',
            }}
          />
        </div>,
        document.body
      )}
    </div>
  )
}

