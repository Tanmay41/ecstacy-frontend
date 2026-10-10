'use client'

import { useState } from 'react'
import {
  X,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  ShieldX,
  Terminal,
  Fingerprint,
  Users,
  ImageIcon,
  Cpu,
  RefreshCw,
  Bot,
} from 'lucide-react'
import type { Screenshot } from '@/types'
import api from '@/lib/api'

const THEME_CSS = `
.fed-scope {
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
.fed-page { background: rgba(0,0,0,0.25); position: relative; overflow: hidden; }
.fed-stage { position: relative; }
.fed-panel {
  position: relative; z-index: 10;
  background: rgba(52,52,52,0.55);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  color: var(--popover-foreground);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1);
}
.fed-panel::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
  background: linear-gradient(160deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 35%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}
.fed-footer-glass { background: rgba(10,11,13,0.4); backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%); }
.fed-card { background: var(--card); color: var(--card-foreground); border: 1px solid var(--border); border-radius: var(--radius-md); transition: border-color .18s ease, box-shadow .18s ease; }
.fed-card:hover { border-color: rgba(255,255,255,0.22); box-shadow: 0 6px 22px rgba(0,0,0,0.3); }
.fed-terminal { background: rgba(0,0,0,0.28); border-radius: var(--radius-sm); }
.fed-border-t { border-top: 1px solid var(--border); }
.fed-border-b { border-bottom: 1px solid var(--border); }
.fed-muted { color: var(--muted-foreground); }
.fed-fg { color: var(--foreground); }
.fed-chip { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; border: 1px solid; backdrop-filter: blur(6px); }
.fed-chip-primary { background: rgba(102,217,110,0.14); color: var(--primary); border-color: rgba(102,217,110,0.35); }
.fed-chip-destructive { background: rgba(229,72,77,0.14); color: var(--destructive); border-color: rgba(229,72,77,0.35); }
.fed-chip-neutral { background: rgba(142,142,142,0.16); color: var(--muted-foreground); border-color: rgba(142,142,142,0.3); }
.fed-chip-secondary { background: var(--secondary); color: var(--secondary-foreground); border-color: var(--border); }
.fed-spine-primary { background: var(--primary); }
.fed-spine-destructive { background: var(--destructive); }
.fed-spine-neutral { background: var(--ring); }
.fed-spine-secondary { background: var(--secondary); }
.fed-spine-pulse { animation: fed-pulse 2.2s ease-in-out infinite; }
@keyframes fed-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes fed-spin { to { transform: rotate(360deg); } }
.fed-ring-primary { box-shadow: 0 0 0 1px rgba(102,217,110,0.35); }
.fed-ring-destructive { box-shadow: 0 0 0 1px rgba(229,72,77,0.35); }
.fed-ring-neutral { box-shadow: 0 0 0 1px rgba(142,142,142,0.3); }
.fed-ring-secondary { box-shadow: 0 0 0 1px var(--border); }
.fed-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: var(--radius-md); font-size: 12px; font-weight: 500; border: 1px solid transparent; cursor: pointer; transition: filter .15s ease, transform .12s ease, box-shadow .18s ease; }
.fed-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
.fed-btn:active { transform: translateY(0) scale(0.96); filter: brightness(0.96); }
.fed-btn-primary { background: var(--primary); color: var(--primary-foreground); }
.fed-btn-primary:hover { box-shadow: 0 6px 18px rgba(102,217,110,0.35); }
.fed-btn-secondary { background: var(--secondary); color: var(--secondary-foreground); border-color: var(--border); }
.fed-btn-destructive { background: var(--destructive); color: #fafafa; }
.fed-btn-destructive:hover { box-shadow: 0 6px 18px rgba(229,72,77,0.35); }
.fed-btn-destructive-outline { background: rgba(229,72,77,0.1); color: var(--destructive); border-color: rgba(229,72,77,0.4); }
.fed-btn-destructive-outline:hover { background: rgba(229,72,77,0.18); }
.fed-icon-btn { padding: 6px; border-radius: var(--radius-sm); color: var(--muted-foreground); background: transparent; border: none; cursor: pointer; transition: background .15s ease, color .15s ease, transform .25s ease; }
.fed-icon-btn:hover { background: var(--accent); color: var(--accent-foreground); transform: rotate(90deg); }
.fed-copy { display: inline-flex; align-items: center; gap: 6px; font-family: ui-monospace, monospace; font-size: 12px; color: var(--foreground); background: none; border: none; cursor: pointer; padding: 3px 6px; margin: -3px -6px; border-radius: var(--radius-sm); transition: background .15s ease, color .15s ease; }
.fed-copy:hover { background: rgba(255,255,255,0.07); color: #fff; }
.fed-user-row { cursor: pointer; transition: background .15s ease, transform .15s ease; }
.fed-user-row:hover { background: var(--accent); transform: translateX(3px); }
.fed-shot-wrap { overflow: hidden; border-radius: var(--radius-sm); border: 1px solid var(--border); max-height: 320px; }
.fed-shot-wrap img { display: block; width: 100%; height: auto; object-fit: contain; transition: transform .35s ease; }
.fed-shot-wrap:hover img { transform: scale(1.035); cursor: zoom-in; }
`

const STATUS_META: Record<string, { label: string; tone: 'neutral' | 'primary' | 'secondary' | 'destructive'; Icon: any; pulse?: boolean }> = {
  pending: { label: 'Pending review', tone: 'neutral', Icon: ShieldAlert, pulse: true },
  reviewed: { label: 'Reviewed', tone: 'primary', Icon: ShieldCheck },
  dismissed: { label: 'Dismissed', tone: 'secondary', Icon: ShieldOff },
  suspended: { label: 'User suspended', tone: 'secondary', Icon: ShieldOff },
  banned: { label: 'User banned', tone: 'destructive', Icon: ShieldX },
}

function hex(n: number | null | undefined): string {
  if (n == null) return '—'
  return '0x' + (n >>> 0).toString(16).toUpperCase()
}

function CopyField({ value }: { value: string | null | undefined }) {
  const [copied, setCopied] = useState(false)
  if (!value) return <span className="fed-muted text-xs">—</span>
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      className="fed-copy"
      title="Copy"
    >
      <span className="break-all text-left">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 shrink-0" style={{ color: 'var(--primary)' }} />
      ) : (
        <Copy className="h-3 w-3 shrink-0 fed-muted" />
      )}
    </button>
  )
}

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="fed-card">
      <div className="fed-border-b flex items-center gap-2 px-4 py-2.5">
        <Icon className="h-3.5 w-3.5 fed-muted" />
        <h3 className="fed-muted text-[11px] font-semibold uppercase" style={{ letterSpacing: '0.06em' }}>
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

type ActionType = 'review' | 'suspend' | 'ban' | 'hwid_ban'

export default function ForensicEventDetail({
  event,
  onClose,
  onAction,
  onImageClick,
}: {
  event: Screenshot
  onClose: () => void
  onAction: (action: ActionType) => void
  onImageClick?: (imageData: string) => void
}) {
  const ctx = (event?.context || {}) as Record<string, unknown>
  const meta = STATUS_META[event?.status] || STATUS_META.pending
  const StatusIcon = meta.Icon

  const eventType = (ctx.eventType as string) || event.trigger || 'unknown_event'
  const source = (ctx.source as string) || 'unknown source'
  const details = ctx.details as string | undefined
  const extra = ctx.extra as string | undefined
  const hwid = ctx.hwid as string | undefined
  const sessionId = ctx.sessionId as string | undefined
  const launchTokenPreview = ctx.launchTokenPreview as string | undefined
  const timestampStr = ctx.timestampStr as string | undefined
  const rawTimestamp = ctx.rawTimestamp as number | undefined
  const threadId = ctx.threadId as number | undefined
  const processId = ctx.processId as number | undefined
  const systemTick = ctx.systemTick as number | undefined
  const screenshotSize = ctx.screenshotSize as number | undefined
  const antiTamperReady = ctx.antiTamperReady as boolean | undefined
  const crippleMode = ctx.crippleMode as boolean | undefined
  const crippleElapsed = ctx.crippleElapsed as number | undefined
  const cripplePart1 = ctx.cripplePart1 as number | undefined
  const cripplePart2 = ctx.cripplePart2 as number | undefined
  const cripplePart3 = ctx.cripplePart3 as number | undefined
  const crippleVerify = ctx.crippleVerify as number | undefined
  const discord = ctx.discord_accounts as Array<{ id: string; username?: string }> | undefined
  const discordResolved = ctx.discord_resolved as
    | Array<{ id: string; username?: string; resolved?: { id: string; username: string; username_legacy: string; avatar: string | null; bot: boolean } }>
    | undefined
  const matchedUsers = ctx.matchedUsers as Array<Record<string, unknown>> | undefined

  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set())
  const [extraResolved, setExtraResolved] = useState<Record<string, { id: string; username: string; username_legacy: string; avatar: string | null; bot: boolean }>>({})

  function getResolved(discordId: string) {
    const found = discordResolved?.find((r) => r.id === discordId)
    return found?.resolved || extraResolved[discordId]
  }

  async function resolveDiscordIds(ids: string[]) {
    const uncached = ids.filter((id) => !getResolved(id))
    if (uncached.length === 0) return
    setResolvingIds((prev) => { const n = new Set(prev); uncached.forEach((id) => n.add(id)); return n })
    try {
      const res = await api.post('/discord/resolve', { ids: uncached })
      if (res.data?.resolved) {
        setExtraResolved((prev) => ({ ...prev, ...res.data.resolved }))
      }
    } catch {}
    setResolvingIds((prev) => { const n = new Set(prev); uncached.forEach((id) => n.delete(id)); return n })
  }



  return (
    <div className="fed-scope fed-page flex items-center justify-center">
      <style>{THEME_CSS}</style>

      <div className="fed-stage max-w-6xl">
        <div className={`fed-panel fed-ring-${meta.tone}`} style={{ maxHeight: '88vh' }}>
          <div className="flex flex-col" style={{ maxHeight: '88vh' }}>
            <div
              className={`fed-spine-${meta.tone} ${meta.pulse ? 'fed-spine-pulse' : ''} absolute left-0 top-0 h-full w-1`}
              style={{ borderTopLeftRadius: 'var(--radius-lg)', borderBottomLeftRadius: 'var(--radius-lg)' }}
            />

            {/* header */}
            <div className="fed-border-b flex items-start justify-between gap-4 px-6 py-4 pl-7">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`fed-chip fed-chip-${meta.tone}`}>
                    <StatusIcon className="h-3 w-3" />
                    {meta.label}
                  </span>
                  <span className="fed-muted text-[11px]" style={{ fontFamily: 'ui-monospace, monospace' }}>
                    {event.id}
                  </span>
                </div>
                <h2 className="fed-fg text-lg font-semibold" style={{ fontFamily: 'ui-monospace, monospace' }}>
                  {eventType}
                </h2>
                <p className="fed-muted text-xs">
                  {source} &middot;{' '}
                  {timestampStr ||
                    (rawTimestamp
                      ? new Date(rawTimestamp * 1000).toLocaleString()
                      : new Date(event.createdAt).toLocaleString())}
                </p>
              </div>
              <button onClick={onClose} className="fed-icon-btn">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 pl-7 space-y-4">
              {!!(details || extra) && (
                <SectionCard icon={Terminal} title="Narrative">
                  <div className="space-y-3">
                    {details && <p className="fed-fg text-sm leading-relaxed">{details}</p>}
                    {extra && (
                      <p className="fed-muted text-sm leading-relaxed pl-3" style={{ borderLeft: '2px solid var(--border)' }}>
                        {extra}
                      </p>
                    )}
                  </div>
                </SectionCard>
              )}

              <div className="grid grid-cols-2 gap-4">
                <SectionCard icon={Fingerprint} title="Identity">
                  <div className="space-y-3">
                    <div>
                      <div className="fed-muted mb-1 text-[11px] uppercase" style={{ letterSpacing: '0.04em' }}>HWID</div>
                      <CopyField value={hwid} />
                    </div>
                    <div>
                      <div className="fed-muted mb-1 text-[11px] uppercase" style={{ letterSpacing: '0.04em' }}>IP address</div>
                      <CopyField value={event.ip || null} />
                    </div>
                    <div>
                      <div className="fed-muted mb-1 text-[11px] uppercase" style={{ letterSpacing: '0.04em' }}>Session</div>
                      <CopyField value={sessionId ? sessionId.slice(0, 24) + '…' : null} />
                    </div>
                    <div>
                      <div className="fed-muted mb-1 text-[11px] uppercase" style={{ letterSpacing: '0.04em' }}>Launch token</div>
                      <CopyField value={launchTokenPreview ? launchTokenPreview + '…' : null} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={Cpu} title="System telemetry">
                  <div className="fed-terminal p-3 text-[11px] leading-6" style={{ fontFamily: 'ui-monospace, monospace' }}>
                    <div className="flex justify-between">
                      <span className="fed-muted">tick</span>
                      <span className="fed-fg">{systemTick ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="fed-muted">tid</span>
                      <span className="fed-fg">{hex(threadId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="fed-muted">pid</span>
                      <span className="fed-fg">{processId ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="fed-muted">anti_tamper</span>
                      <span style={{ color: antiTamperReady ? 'var(--primary)' : 'var(--destructive)' }}>
                        {antiTamperReady ? 'ready' : 'not_ready'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="fed-muted">cripple_mode</span>
                      <span className="fed-fg" style={{ opacity: crippleMode ? 1 : 0.5 }}>
                        {crippleMode ? 'active' : 'inactive'}
                      </span>
                    </div>
                    {crippleMode && (
                      <>
                        <div className="flex justify-between">
                          <span className="fed-muted">elapsed</span>
                          <span className="fed-fg">{crippleElapsed?.toFixed(2)}s</span>
                        </div>
                        <div className="fed-muted mt-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                          {hex(cripplePart1)} {hex(cripplePart2)} {hex(cripplePart3)}{' '}
                          <span>verify={crippleVerify}</span>
                        </div>
                      </>
                    )}
                  </div>
                </SectionCard>
              </div>

              {!!((discord || []).length > 0 || (matchedUsers || []).length > 0) && (
                <SectionCard icon={Users} title="Linked accounts">
                  <div className="space-y-3">
                    {matchedUsers?.map((m, i) => (
                      <div
                        key={'u' + i}
                        className="fed-user-row flex items-center justify-between px-3 py-2"
                        style={{ background: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="fed-fg text-sm font-medium">{m.username as string}</span>
                          <span className="fed-muted text-xs">{m.email as string}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {(m.hwid as string) && (
                            <span className="fed-muted text-[10px]" style={{ fontFamily: 'ui-monospace, monospace' }}>
                              {(m.hwid as string).slice(0, 12)}…
                            </span>
                          )}
                          <span
                            className={`fed-chip ${
                              m.status === 'banned'
                                ? 'fed-chip-destructive'
                                : m.status === 'suspended'
                                ? 'fed-chip-secondary'
                                : 'fed-chip-neutral'
                            }`}
                          >
                            {m.status as string}
                          </span>
                        </div>
                      </div>
                    ))}
                    {discord?.map((d, i) => {
                      const r = getResolved(d.id)
                      const loading = resolvingIds.has(d.id)
                      return (
                        <div
                          key={'d' + i}
                          className="flex items-center gap-3 px-3 py-2"
                          style={{ background: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}
                        >
                          {r?.avatar ? (
                            <img
                              src={r.avatar}
                              alt=""
                              style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: 'var(--muted)', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, color: 'var(--muted-foreground)',
                              }}
                            >
                              ?
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="fed-fg text-sm font-medium truncate">
                                {r?.username || d.username || d.id}
                              </span>
                              {r?.bot && <Bot className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />}
                            </div>
                            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted-foreground)' }}>
                              {d.id}
                            </div>
                          </div>
                          {!r && !loading && (
                            <button
                              onClick={() => resolveDiscordIds([d.id])}
                              className="fed-btn fed-btn-secondary"
                              style={{ flexShrink: 0, padding: '3px 8px', fontSize: 10 }}
                            >
                              <RefreshCw className="h-3 w-3" />
                              Resolve
                            </button>
                          )}
                          {loading && (
                            <RefreshCw className="h-3 w-3" style={{ color: 'var(--muted-foreground)', animation: 'fed-spin 1s linear infinite', flexShrink: 0 }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </SectionCard>
              )}

              <SectionCard icon={ImageIcon} title="Captured evidence">
                {event.imageData && event.imageData !== 'no_screenshot' ? (
                  <>
                    <div className="fed-shot-wrap" onClick={() => onImageClick?.(event.imageData)}>
                      <img src={`data:image/jpeg;base64,${event.imageData}`} alt="Report image" />
                    </div>
                    {screenshotSize && (
                      <p className="fed-muted mt-2 text-[11px]">{(screenshotSize / 1024).toFixed(1)} KB</p>
                    )}
                  </>
                ) : (
                  <p className="fed-muted text-xs">No visual attached to this event.</p>
                )}
              </SectionCard>


            </div>

            {/* actions */}
            {event.status === 'pending' && (
              <div className="fed-footer-glass fed-border-t flex flex-wrap items-center gap-2 px-6 py-3.5 pl-7">
                <button onClick={() => onAction('review')} className="fed-btn fed-btn-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Mark reviewed
                </button>
                <button onClick={() => onAction('suspend')} className="fed-btn fed-btn-secondary">
                  <ShieldOff className="h-3.5 w-3.5" />
                  Suspend user
                </button>
                <button onClick={() => onAction('ban')} className="fed-btn fed-btn-destructive">
                  <ShieldX className="h-3.5 w-3.5" />
                  Ban user
                </button>
                <button onClick={() => onAction('hwid_ban')} className="fed-btn fed-btn-destructive-outline">
                  <Fingerprint className="h-3.5 w-3.5" />
                  HWID ban
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
