'use client'

import { useState } from 'react'
import {
  X, Copy, Check,
  Wifi, WifiOff, Clock, Cpu, Fingerprint, Globe, User, Tag, Activity,
} from 'lucide-react'

const THEME_CSS = `
.sd-scope {
  --background: #242424;
  --foreground: #fafafa;
  --card: #343434;
  --card-foreground: #fafafa;
  --popover: #343434;
  --popover-foreground: #fafafa;
  --primary: #66d96e;
  --primary-foreground: #3d7a37;
  --secondary: #44464b;
  --secondary-foreground: #fafafa;
  --muted: #444444;
  --muted-foreground: #b4b4b4;
  --accent: #444444;
  --accent-foreground: #fafafa;
  --destructive: #e5484d;
  --border: rgba(255,255,255,0.1);
  --input: rgba(255,255,255,0.15);
  --ring: #8e8e8e;
  --surface-950: #0a0b0d;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;
  --radius-xl: 0.875rem;
  color-scheme: dark;
}
.sd-page { background: rgba(0,0,0,0.25); position: relative; overflow: hidden; }
.sd-stage { position: relative; }
.sd-panel {
  position: relative; z-index: 10;
  background: rgba(52,52,52,0.55);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  color: var(--popover-foreground);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1);
}
.sd-panel::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
  background: linear-gradient(160deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 35%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}
.sd-footer-glass { background: rgba(10,11,13,0.4); backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%); }
.sd-card { background: var(--card); color: var(--card-foreground); border: 1px solid var(--border); border-radius: var(--radius-md); transition: border-color .18s ease, box-shadow .18s ease; }
.sd-card:hover { border-color: rgba(255,255,255,0.22); box-shadow: 0 6px 22px rgba(0,0,0,0.3); }
.sd-terminal { background: rgba(0,0,0,0.28); border-radius: var(--radius-sm); }
.sd-border-t { border-top: 1px solid var(--border); }
.sd-border-b { border-bottom: 1px solid var(--border); }
.sd-muted { color: var(--muted-foreground); }
.sd-fg { color: var(--foreground); }
.sd-chip { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; border: 1px solid; backdrop-filter: blur(6px); }
.sd-chip-primary { background: rgba(102,217,110,0.14); color: var(--primary); border-color: rgba(102,217,110,0.35); }
.sd-chip-destructive { background: rgba(229,72,77,0.14); color: var(--destructive); border-color: rgba(229,72,77,0.35); }
.sd-chip-neutral { background: rgba(142,142,142,0.16); color: var(--muted-foreground); border-color: rgba(142,142,142,0.3); }
.sd-chip-secondary { background: var(--secondary); color: var(--secondary-foreground); border-color: var(--border); }
.sd-spine-primary { background: var(--primary); }
.sd-spine-destructive { background: var(--destructive); }
.sd-spine-neutral { background: var(--ring); }
.sd-spine-secondary { background: var(--secondary); }
.sd-spine-pulse { animation: sd-pulse 2.2s ease-in-out infinite; }
@keyframes sd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.sd-ring-primary { box-shadow: 0 0 0 1px rgba(102,217,110,0.35); }
.sd-ring-destructive { box-shadow: 0 0 0 1px rgba(229,72,77,0.35); }
.sd-ring-neutral { box-shadow: 0 0 0 1px rgba(142,142,142,0.3); }
.sd-ring-secondary { box-shadow: 0 0 0 1px var(--border); }
.sd-icon-btn { padding: 6px; border-radius: var(--radius-sm); color: var(--muted-foreground); background: transparent; border: none; cursor: pointer; transition: background .15s ease, color .15s ease, transform .25s ease; }
.sd-icon-btn:hover { background: var(--accent); color: var(--accent-foreground); transform: rotate(90deg); }
.sd-copy { display: inline-flex; align-items: center; gap: 6px; font-family: ui-monospace, monospace; font-size: 12px; color: var(--foreground); background: none; border: none; cursor: pointer; padding: 3px 6px; margin: -3px -6px; border-radius: var(--radius-sm); transition: background .15s ease, color .15s ease; }
.sd-copy:hover { background: rgba(255,255,255,0.07); color: #fff; }
.sd-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
`

function formatUptime(startedAt: string): string {
  const ms = Date.now() - new Date(startedAt).getTime()
  const mins = Math.floor(ms / 60000)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) return `${hrs}h ${mins % 60}m`
  if (mins > 0) return `${mins}m`
  return '<1m'
}

function CopyField({ value }: { value: string | null | undefined }) {
  const [copied, setCopied] = useState(false)
  if (!value) return <span className="sd-muted text-xs">—</span>
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200) }}
      className="sd-copy"
      title="Copy"
    >
      <span className="break-all text-left">{value}</span>
      {copied ? <Check className="h-3 w-3 shrink-0" style={{ color: 'var(--primary)' }} /> : <Copy className="h-3 w-3 shrink-0 sd-muted" />}
    </button>
  )
}

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="sd-card">
      <div className="sd-border-b flex items-center gap-2 px-4 py-2.5">
        <Icon className="h-3.5 w-3.5 sd-muted" />
        <h3 className="sd-muted text-[11px] font-semibold uppercase" style={{ letterSpacing: '0.06em' }}>{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

interface SessionUser {
  _id: string; username: string; email: string; role: string; status: string; hwid?: string
}

interface MenuSessionDetail {
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

interface WebSessionDetail {
  type: 'access' | 'loader'
  user: SessionUser | null
  ip: string
  userAgent: string
  token: string
  expiresAt: string
  createdAt: string
}

type AnySessionDetail = MenuSessionDetail | WebSessionDetail

export default function SessionDetail({ session, onClose }: { session: AnySessionDetail; onClose: () => void }) {
  const isMenu = session.type === 'menu'
  const s = session as MenuSessionDetail

  const statusTone = isMenu
    ? s.heartbeatAge < 30 ? 'primary' as const : s.heartbeatAge < 120 ? 'secondary' as const : 'destructive' as const
    : 'primary' as const

  const statusLabel = isMenu
    ? s.heartbeatAge < 30 ? 'Online' : s.heartbeatAge < 120 ? 'Idle' : 'Stale'
    : session.type === 'access' ? 'Web session' : 'Loader session'

  const StatusIcon = isMenu
    ? s.heartbeatAge < 30 ? Wifi : s.heartbeatAge < 120 ? Clock : WifiOff
    : Wifi

  const u = session.user

  return (
    <div className="sd-scope sd-page flex items-center justify-center">
      <style>{THEME_CSS}</style>
      <div className="sd-stage max-w-6xl">
        <div className={`sd-panel sd-ring-${statusTone}`} style={{ maxHeight: '88vh' }}>
          <div className="flex flex-col" style={{ maxHeight: '88vh' }}>
            <div className={`sd-spine-${statusTone} ${isMenu && s.heartbeatAge < 30 ? 'sd-spine-pulse' : ''} absolute left-0 top-0 h-full w-1`}
              style={{ borderTopLeftRadius: 'var(--radius-lg)', borderBottomLeftRadius: 'var(--radius-lg)' }} />

            {/* header */}
            <div className="sd-border-b flex items-start justify-between gap-4 px-6 py-4 pl-7">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`sd-chip sd-chip-${statusTone}`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusLabel}
                  </span>
                  {isMenu && u && (
                    <span className={`sd-chip ${u.status === 'banned' ? 'sd-chip-destructive' : u.status === 'suspended' ? 'sd-chip-secondary' : 'sd-chip-neutral'}`}>
                      {u.status}
                    </span>
                  )}
                  <span className="sd-muted text-[11px]" style={{ fontFamily: 'ui-monospace, monospace' }}>
                    {isMenu ? s.sessionId.slice(0, 12) + '…' : session.type}
                  </span>
                </div>
                <h2 className="sd-fg text-lg font-semibold">
                  {isMenu ? `Menu — ${s.productSlug || 'unknown'}` : `${session.type === 'access' ? 'Web' : 'Loader'} Session`}
                </h2>
                <p className="sd-muted text-xs">
                  {session.ip || 'unknown IP'} &middot;{' '}
                  {new Date(isMenu ? s.startedAt : session.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={onClose} className="sd-icon-btn"><X className="h-4 w-4" /></button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 pl-7 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SectionCard icon={User} title="User">
                  <div className="flex items-center gap-3">
                    <div className="sd-avatar" style={{ background: u ? 'rgba(102,217,110,0.2)' : 'var(--muted)', color: u ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                      {u?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="sd-fg text-sm font-medium">{u?.username || 'Unauthenticated'}</div>
                      <div className="sd-muted text-xs">{u?.email || '—'}</div>
                      {u && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="sd-muted text-[10px] capitalize">{u.role}</span>
                          {u.hwid && <span className="sd-muted text-[10px]" style={{ fontFamily: 'ui-monospace, monospace' }}>HWID: {u.hwid.slice(0, 8)}…</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={Globe} title="Connection">
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="sd-muted">IP</span>
                      <CopyField value={session.ip} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="sd-muted">Type</span>
                      <span className="sd-fg capitalize">{session.type}</span>
                    </div>
                    {isMenu && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="sd-muted">Product</span>
                          <span className="sd-fg">{s.productSlug || '—'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="sd-muted">Valid</span>
                          <span style={{ color: s.valid ? 'var(--primary)' : 'var(--destructive)' }}>{s.valid ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="sd-muted">Launch Token</span>
                          <CopyField value={s.launchTokenPreview} />
                        </div>
                      </>
                    )}
                    {!isMenu && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="sd-muted">Created</span>
                          <span className="sd-fg text-[11px]">{new Date(session.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="sd-muted">Expires</span>
                          <span className="sd-fg text-[11px]">{new Date((session as WebSessionDetail).expiresAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="sd-muted">Token</span>
                          <CopyField value={(session as WebSessionDetail).token} />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="sd-muted">User Agent</span>
                          <span className="sd-fg text-[11px] truncate max-w-[180px]" title={(session as WebSessionDetail).userAgent}>
                            {(session as WebSessionDetail).userAgent || '—'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </SectionCard>
              </div>

              {!isMenu && (
                <SectionCard icon={Clock} title="Session Info">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="sd-terminal p-3">
                      <div className="sd-muted text-[10px]">Created</div>
                      <div className="sd-fg font-medium mt-0.5 text-[11px]">{new Date(session.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="sd-terminal p-3">
                      <div className="sd-muted text-[10px]">Expires</div>
                      <div className="sd-fg font-medium mt-0.5 text-[11px]">{new Date((session as WebSessionDetail).expiresAt).toLocaleString()}</div>
                    </div>
                    <div className="sd-terminal p-3">
                      <div className="sd-muted text-[10px]">Duration</div>
                      <div className="sd-fg font-medium mt-0.5 text-[11px]">
                        {Math.floor((new Date((session as WebSessionDetail).expiresAt).getTime() - new Date(session.createdAt).getTime()) / 60000)}m
                      </div>
                    </div>
                    <div className="sd-terminal p-3">
                      <div className="sd-muted text-[10px]">Remaining</div>
                      <div className="sd-fg font-medium mt-0.5 text-[11px]">
                        {Math.max(0, Math.floor((new Date((session as WebSessionDetail).expiresAt).getTime() - Date.now()) / 60000))}m
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {isMenu && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <SectionCard icon={Fingerprint} title="Hardware identity">
                      <div className="space-y-2.5">
                        <div>
                          <div className="sd-muted text-[11px] uppercase mb-1" style={{ letterSpacing: '0.04em' }}>HWID</div>
                          <CopyField value={s.hwid} />
                        </div>
                        <div>
                          <div className="sd-muted text-[11px] uppercase mb-1" style={{ letterSpacing: '0.04em' }}>Session ID</div>
                          <CopyField value={s.sessionId} />
                        </div>
                        {u?.hwid && (
                          <div>
                            <div className="sd-muted text-[11px] uppercase mb-1" style={{ letterSpacing: '0.04em' }}>User HWID</div>
                            <CopyField value={u.hwid} />
                          </div>
                        )}
                      </div>
                    </SectionCard>

                    <SectionCard icon={Activity} title="Heartbeat">
                      <div className="space-y-3">
                        {/* progress bar */}
                        <div style={{ height: 6, borderRadius: 3, background: 'var(--muted)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            background: s.heartbeatAge < 30 ? 'var(--primary)' : s.heartbeatAge < 120 ? '#eab308' : 'var(--destructive)',
                            width: `${Math.max(5, Math.min(100, 100 - (s.heartbeatAge / 300) * 100))}%`,
                            transition: 'width .5s ease',
                          }} />
                        </div>
                        <div className="flex justify-between text-[10px] sd-muted">
                          <span>Last: {s.heartbeatAge}s ago</span>
                          <span>Expected every 30s</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="sd-terminal p-2">
                            <div className="sd-muted text-[10px]">Status</div>
                            <div style={{ color: s.heartbeatAge < 30 ? 'var(--primary)' : s.heartbeatAge < 120 ? '#eab308' : 'var(--destructive)' }} className="font-medium">
                              {s.heartbeatAge < 30 ? 'Online' : s.heartbeatAge < 120 ? 'Idle' : 'Stale'}
                            </div>
                          </div>
                          <div className="sd-terminal p-2">
                            <div className="sd-muted text-[10px]">Heartbeat Age</div>
                            <div className="sd-fg font-medium">{s.heartbeatAge}s</div>
                          </div>
                          <div className="sd-terminal p-2">
                            <div className="sd-muted text-[10px]">Uptime</div>
                            <div className="sd-fg font-medium">{formatUptime(s.startedAt)}</div>
                          </div>
                          <div className="sd-terminal p-2">
                            <div className="sd-muted text-[10px]">Next Expected</div>
                            <div className="sd-fg font-medium">{s.heartbeatAge >= 30 ? 'Overdue' : `${30 - s.heartbeatAge}s`}</div>
                          </div>
                        </div>
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard icon={Clock} title="Timeline">
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="sd-terminal p-3">
                        <div className="sd-muted text-[10px]">Session Created</div>
                        <div className="sd-fg font-medium mt-0.5 text-[11px]">{new Date(s.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="sd-terminal p-3">
                        <div className="sd-muted text-[10px]">Started</div>
                        <div className="sd-fg font-medium mt-0.5 text-[11px]">{new Date(s.startedAt).toLocaleString()}</div>
                      </div>
                      <div className="sd-terminal p-3">
                        <div className="sd-muted text-[10px]">Last Heartbeat</div>
                        <div className="sd-fg font-medium mt-0.5 text-[11px]">{new Date(s.lastHeartbeat).toLocaleString()}</div>
                      </div>
                      <div className="sd-terminal p-3">
                        <div className="sd-muted text-[10px]">Elapsed</div>
                        <div className="sd-fg font-medium mt-0.5 text-[11px]">{formatUptime(s.startedAt)}</div>
                      </div>
                      <div className="sd-terminal p-3">
                        <div className="sd-muted text-[10px]">Denial</div>
                        <div className="sd-fg font-medium mt-0.5 text-[11px]">{s.endedAt ? new Date(s.endedAt).toLocaleString() : 'Active'}</div>
                      </div>
                      <div className="sd-terminal p-3">
                        <div className="sd-muted text-[10px]">Heartbeats</div>
                        <div className="sd-fg font-medium mt-0.5 text-[11px]">
                          {s.heartbeatAge < 30 ? '1 / 30s' : s.heartbeatAge < 120 ? `${Math.floor(s.heartbeatAge / 30)} missed` : 'Ended'}
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
