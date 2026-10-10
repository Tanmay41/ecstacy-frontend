'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Screenshot, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  RiImageLine,
  RiLoaderLine,
  RiCheckLine,
  RiCloseLine,
  RiForbidLine,
  RiLockUnlockLine,
  RiUserLine,
  RiComputerLine,
  RiAlertLine,
  RiInformationLine,
  RiExternalLinkLine,
  RiShieldFlashLine,
  RiGlobalLine,
  RiBugLine,
  RiTimeLine,
  RiCpuLine,
  RiFingerprintLine,
  RiKeyLine,
  RiSettings3Line,
  RiNumbersLine,
} from '@remixicon/react'
import { toast } from 'sonner'

const triggerLabel: Record<string, string> = {
  hwid_mismatch: 'HWID Mismatch',
  vm_detect: 'VM Detect',
  debug_detect: 'Debug Detect',
  login_failed: 'Login Failed',
  manual: 'Manual',
  forensic: 'Security Event',
}

const triggerVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  hwid_mismatch: 'destructive',
  vm_detect: 'warning' as any,
  debug_detect: 'secondary',
  login_failed: 'default',
  manual: 'outline',
  forensic: 'destructive',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  pending: 'default',
  reviewed: 'secondary',
  dismissed: 'outline',
}

const eventTypeColor: Record<string, string> = {
  INTEGRITY_FAIL: 'text-red-400',
  CRIPPLE_XOR: 'text-orange-400',
  ANTI_DEBUG: 'text-yellow-400',
  WINDOW_DETECTED: 'text-cyan-400',
  HOOK_DETECTED: 'text-pink-400',
  MEMORY_READ: 'text-purple-400',
  PROCESS_DETECTED: 'text-rose-400',
}

interface MatchUser {
  _id: string
  username: string
  email: string
  role: string
  status: string
  hwid?: string
  ip?: string
  createdAt?: string
  lastLogin?: string
}

interface DiscordResolved {
  id: string
  username: string
  username_legacy?: string
  avatar?: string
  bot?: boolean
}

function ForensicReport({ context }: { context: Record<string, unknown> }) {
  const fields: { label: string; value: string; icon: React.ReactNode }[] = [
    { label: 'Event Type', value: String(context.eventType || 'N/A'), icon: <RiBugLine className="h-3.5 w-3.5" /> },
    { label: 'Source Function', value: String(context.source || 'N/A'), icon: <RiCpuLine className="h-3.5 w-3.5" /> },
    { label: 'Details', value: String(context.details || 'N/A'), icon: <RiAlertLine className="h-3.5 w-3.5" /> },
    { label: 'Extra', value: String(context.extra || ''), icon: <RiInformationLine className="h-3.5 w-3.5" /> },
    { label: 'Thread ID', value: String(context.threadId ?? 'N/A'), icon: <RiNumbersLine className="h-3.5 w-3.5" /> },
    { label: 'Process ID', value: String(context.processId ?? 'N/A'), icon: <RiComputerLine className="h-3.5 w-3.5" /> },
    { label: 'Timestamp', value: context.timestampStr ? String(context.timestampStr) : String(context.rawTimestamp ?? 'N/A'), icon: <RiTimeLine className="h-3.5 w-3.5" /> },
    { label: 'Cripple Elapsed', value: context.crippleElapsed != null ? `${Number(context.crippleElapsed).toFixed(1)}s` : 'N/A', icon: <RiTimeLine className="h-3.5 w-3.5" /> },
    { label: 'System Tick', value: String(context.systemTick ?? 'N/A'), icon: <RiTimeLine className="h-3.5 w-3.5" /> },
    { label: 'HWID', value: String(context.hwid || 'N/A'), icon: <RiFingerprintLine className="h-3.5 w-3.5" /> },
    { label: 'Session ID', value: String(context.sessionId || 'N/A'), icon: <RiKeyLine className="h-3.5 w-3.5" /> },
    { label: 'Launch Token', value: String(context.launchTokenPreview || 'N/A'), icon: <RiKeyLine className="h-3.5 w-3.5" /> },
    { label: 'Cripple Mode', value: context.crippleMode ? 'Active' : 'Inactive', icon: <RiSettings3Line className="h-3.5 w-3.5" /> },
    { label: 'Cripple Part 1', value: String(context.cripplePart1 ?? 'N/A'), icon: <RiNumbersLine className="h-3.5 w-3.5" /> },
    { label: 'Cripple Part 2', value: String(context.cripplePart2 ?? 'N/A'), icon: <RiNumbersLine className="h-3.5 w-3.5" /> },
    { label: 'Cripple Part 3', value: String(context.cripplePart3 ?? 'N/A'), icon: <RiNumbersLine className="h-3.5 w-3.5" /> },
    { label: 'Cripple Verify', value: String(context.crippleVerify ?? 'N/A'), icon: <RiNumbersLine className="h-3.5 w-3.5" /> },
    { label: 'Anti-Tamper', value: context.antiTamperReady ? 'Ready' : 'Not Ready', icon: <RiShieldFlashLine className="h-3.5 w-3.5" /> },
    { label: 'Visual Size', value: context.screenshotSize != null ? `${Number(context.screenshotSize).toLocaleString()} bytes` : 'N/A', icon: <RiImageLine className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-red-950/20 px-4 py-2.5">
        <RiBugLine className="h-4 w-4 text-red-400" />
        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Security Report</span>
      </div>
      <div className="grid gap-px sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center gap-2 bg-background/50 px-4 py-2 text-xs">
            <span className="shrink-0 text-muted-foreground">{f.icon}</span>
            <span className="shrink-0 text-muted-foreground w-28">{f.label}</span>
            <span className="font-mono text-foreground truncate" title={f.value}>{f.value}</span>
          </div>
        ))}
      </div>

      {/* Extra key=value pairs parsed nicely */}
      {(context.extra as string) && String(context.extra).length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Extra Pairs</div>
          <div className="flex flex-wrap gap-2">
            {String(context.extra).split(';').filter(Boolean).map((pair, i) => {
              const [k, ...v] = pair.split('=')
              return (
                <Badge key={i} variant="outline" className="text-[10px] font-mono">
                  <span className="text-muted-foreground">{k}:</span>
                  <span className="ml-1 text-foreground">{v.join('=') || '(empty)'}</span>
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScreenshotsPage() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<Screenshot | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchUser[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [discordResolved, setDiscordResolved] = useState<Record<string, DiscordResolved>>({})
  const [discordResolving, setDiscordResolving] = useState(false)

  function fetchScreenshots() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (filter !== 'all') params.set('status', filter)
    api.get(`/screenshots?${params}`).then((r) => {
      if (r.data.screenshots) setScreenshots(r.data.screenshots)
      if (r.data.totalPages) setTotalPages(r.data.totalPages)
    }).catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchScreenshots() }, [page, filter])

  async function handleReview(id: string, action?: string, reason?: string) {
    setActionLoading(id)
    try {
      const body: Record<string, unknown> = {}
      if (action) body.action = action
      if (reason) body.reason = reason
      await api.patch(`/screenshots/${id}/review`, body)
      toast.success('Report reviewed')
      setScreenshots((prev) => prev.map((s) => s.id === id ? { ...s, status: 'reviewed' as const } : s))
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: 'reviewed' as const } : null)
    } catch { toast.error('Failed to review report') }
    finally { setActionLoading(null) }
  }

  async function handleDismiss(id: string) {
    setActionLoading(id)
    try {
      await api.patch(`/screenshots/${id}/dismiss`)
      toast.success('Report dismissed')
      setScreenshots((prev) => prev.map((s) => s.id === id ? { ...s, status: 'dismissed' as const } : s))
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: 'dismissed' as const } : null)
    } catch { toast.error('Failed to dismiss report') }
    finally { setActionLoading(null) }
  }

  async function openDetail(s: Screenshot) {
    setSelected(s)
    setDialogOpen(true)
    setMatches([])
    setDiscordResolved({})

    const ctx = s.context as Record<string, unknown> | undefined
    const discordAccounts = ctx?.discord_accounts as Array<{ id: string }> | undefined
    if (discordAccounts && discordAccounts.length > 0) {
      setDiscordResolving(true)
      try {
        const r = await api.post('/discord/resolve', { ids: discordAccounts.map(a => a.id) })
        if (r.data.resolved) setDiscordResolved(r.data.resolved)
      } catch { /* bot not configured or error */ }
      finally { setDiscordResolving(false) }
    }

    setMatchesLoading(true)
    try {
      const r = await api.get(`/screenshots/${s.id}/matches`)
      if (r.data.matches) setMatches(r.data.matches)
    } catch { /* silently fail */ }
    finally { setMatchesLoading(false) }
  }

  const ctx = selected?.context as Record<string, unknown> | undefined
  const isForensic = selected?.trigger === 'forensic'

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review client reports and security events</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => { setFilter(v || 'pending'); setPage(1) }}>
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RiLoaderLine className="h-5 w-5 animate-spin" />
            <span>Loading reports...</span>
          </div>
        </div>
      ) : screenshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <RiImageLine className="h-10 w-10" />
          <p>No reports found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {screenshots.map((s) => {
            const user = typeof s.userId === 'object' ? s.userId as { username: string } : null
            const ctx = s.context as Record<string, unknown> | undefined
            const evType = ctx?.eventType as string | undefined
            const evSource = ctx?.source as string | undefined
            const evDetail = ctx?.details as string | undefined
            const forensic = s.trigger === 'forensic'

            return (
              <div
                key={s.id}
                className={`group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg hover:shadow-foreground/5 ${
                  forensic ? 'border-red-500/40 ring-1 ring-red-500/10' : 'border-border'
                }`}
              >
                <button onClick={() => openDetail(s)} className="block w-full text-left">
                  {forensic ? (
                    <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-red-950/40 via-zinc-950 to-zinc-900 flex flex-col items-center justify-center gap-1 p-4">
                      <RiBugLine className="h-8 w-8 text-red-400/60" />
                      <span className="text-xs font-bold text-red-400/80 uppercase tracking-wider">Security Event</span>
                    </div>
                  ) : (
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={`data:image/png;base64,${s.imageData}`}
                        alt="Report"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={triggerVariant[s.trigger] || 'outline'}>
                        {triggerLabel[s.trigger] || s.trigger}
                      </Badge>
                      <Badge variant={statusVariant[s.status] || 'outline'}>
                        {s.status}
                      </Badge>
                    </div>
                    {forensic && evType && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`text-xs font-bold ${eventTypeColor[evType] || 'text-foreground'}`}>
                          {evType}
                        </span>
                        {evSource && (
                          <span className="text-xs text-muted-foreground">@{evSource}</span>
                        )}
                      </div>
                    )}
                    {forensic && evDetail && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{evDetail}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RiUserLine className="h-3.5 w-3.5" />
                      <span>{user?.username || (typeof s.userId === 'string' ? s.userId : 'Unknown')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>
                </button>
                {s.status === 'pending' && (
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => handleReview(s.id)}
                      disabled={actionLoading === s.id}
                      title="Mark reviewed"
                    >
                      <RiCheckLine className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleDismiss(s.id)}
                      disabled={actionLoading === s.id}
                      title="Dismiss"
                    >
                      <RiCloseLine className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="min-w-[700px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isForensic ? 'Security Event Details' : 'Report Details'}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              {/* Image */}
              {selected.imageData ? (
                <div className="overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={`data:image/png;base64,${selected.imageData}`}
                    alt="Report"
                    className="w-full object-contain max-h-[500px]"
                  />
                </div>
              ) : isForensic ? (
                <div className="flex items-center justify-center rounded-lg border border-border bg-gradient-to-br from-red-950/20 to-zinc-950 py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <RiBugLine className="h-10 w-10 text-red-400/50" />
                    <span className="text-xs">No visual captured for this event</span>
                  </div>
                </div>
              ) : null}

              {/* Summary grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-xs text-muted-foreground">Trigger</span>
                  <Badge variant={triggerVariant[selected.trigger] || 'outline'}>
                    {triggerLabel[selected.trigger] || selected.trigger}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge variant={statusVariant[selected.status] || 'outline'}>
                    {selected.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-xs text-muted-foreground">User</span>
                  <span className="text-xs font-medium truncate max-w-[160px]">{typeof selected.userId === 'object' ? (selected.userId as { username: string })?.username || 'Unknown' : selected.userId || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-xs text-muted-foreground">Time</span>
                  <span className="text-xs">{new Date(selected.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-xs text-muted-foreground">IP</span>
                  <span className="font-mono text-xs">{selected.ip || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-xs text-muted-foreground">User Agent</span>
                  <span className="text-xs truncate max-w-[180px]" title={selected.userAgent}>{selected.userAgent || 'N/A'}</span>
                </div>
              </div>

              {/* Forensic report section */}
              {isForensic && ctx && <ForensicReport context={ctx} />}

              {/* Discord accounts */}
              {ctx && (ctx.discord_accounts as Array<{ id: string; username?: string }> | undefined) && (
                <div className="rounded-lg border border-border">
                  <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    <RiUserLine className="h-3.5 w-3.5" />
                    Discord Accounts ({(ctx.discord_accounts as Array<unknown>).length})
                    {discordResolving && (
                      <RiLoaderLine className="ml-1 h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {(ctx.discord_accounts as Array<{ id: string; username?: string; username_legacy?: string }>).map((acc) => {
                      const resolved = discordResolved[acc.id]
                      return (
                        <div key={acc.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs">
                          <span className="font-medium text-foreground">{resolved?.username || acc.username || 'Unknown'}</span>
                          <span className="font-mono text-muted-foreground">ID: {acc.id}</span>
                          {resolved?.avatar && (
                            <img src={resolved.avatar} className="inline-block h-4 w-4 rounded-full" alt="" />
                          )}
                          {acc.username_legacy && !resolved && (
                            <span className="text-muted-foreground">LevelDB: {acc.username_legacy}</span>
                          )}
                          {resolved && resolved.username !== resolved.username_legacy && (
                            <span className="text-muted-foreground">Legacy: {resolved.username_legacy}</span>
                          )}
                          {resolved && <span className="text-[10px] text-green-500">verified by bot</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Loader context data */}
              {ctx && Object.keys(ctx).length > 0 && !isForensic && (
                <>
                  {(ctx.discord_accounts as Array<unknown> | undefined) && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <RiInformationLine className="h-3.5 w-3.5" />
                        Loader Context Data
                      </div>
                      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(ctx).filter(([k]) => k !== 'discord_accounts').map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between gap-2 rounded-md bg-background/50 px-2.5 py-1.5 text-xs">
                            <span className="text-muted-foreground shrink-0">{key}</span>
                            <span className="font-mono truncate max-w-[200px]" title={String(val)}>{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {matches.length > 0 && (
                <div className="rounded-lg border border-border">
                  <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    <RiUserLine className="h-3.5 w-3.5" />
                    Matched Users ({matches.length})
                  </div>
                  <div className="divide-y divide-border">
                    {matches.map((m) => (
                      <div key={m._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-xs">
                        <span className="font-medium text-foreground">{m.username}</span>
                        <span className="text-muted-foreground">{m.email}</span>
                        <Badge variant={m.status === 'banned' ? 'destructive' : m.status === 'suspended' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                          {m.status}
                        </Badge>
                        {m.hwid && (
                          <span className="font-mono text-[10px] text-muted-foreground" title={m.hwid}>
                            HWID: {m.hwid.substring(0, 16)}...
                          </span>
                        )}
                        {m.ip && (
                          <span className="font-mono text-[10px] text-muted-foreground">IP: {m.ip}</span>
                        )}
                        {m.lastLogin && (
                          <span className="text-muted-foreground">Last login: {new Date(m.lastLogin).toLocaleDateString()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchesLoading && (
                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                  <RiLoaderLine className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Searching for matches...
                </div>
              )}

              {!matchesLoading && matches.length === 0 && ctx && Object.keys(ctx).length > 0 && (
                <div className="flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground">
                  <RiAlertLine className="h-3.5 w-3.5" />
                  No users match this report
                </div>
              )}

              {selected.status === 'pending' && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button size="sm" onClick={() => handleReview(selected.id)} disabled={actionLoading === selected.id}>
                    <RiCheckLine className="mr-1.5 h-4 w-4" />Mark Reviewed
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReview(selected.id, 'ban')} disabled={actionLoading === selected.id}>
                    <RiForbidLine className="mr-1.5 h-4 w-4" />Ban User
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleReview(selected.id, 'suspend')} disabled={actionLoading === selected.id}>
                    <RiLockUnlockLine className="mr-1.5 h-4 w-4" />Suspend User
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReview(selected.id, 'hwid_ban')} disabled={actionLoading === selected.id} className="border-red-500/30">
                    <RiShieldFlashLine className="mr-1.5 h-4 w-4" />HWID Ban
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReview(selected.id, 'ip_ban')} disabled={actionLoading === selected.id} className="border-red-500/30">
                    <RiGlobalLine className="mr-1.5 h-4 w-4" />IP Ban
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDismiss(selected.id)} disabled={actionLoading === selected.id}>
                    <RiCloseLine className="mr-1.5 h-4 w-4" />Dismiss
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
