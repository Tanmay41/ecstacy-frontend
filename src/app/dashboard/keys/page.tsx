'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import type { Key, Product, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SortableTh } from '@/components/ui/sortable-th'
import { useSort } from '@/hooks/useSort'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { RiEyeLine, RiTimeLine, RiDeleteBinLine, RiUserLine } from '@remixicon/react'
import CopyButton from '@/components/CopyButton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const statusVariant = (s: string) => {
  switch (s) {
    case 'active': return 'default' as const
    case 'used': return 'secondary' as const
    case 'expired': return 'outline' as const
    default: return 'destructive' as const
  }
}

export default function KeysPage() {
  const { user } = useAuth()
  const [keys, setKeys] = useState<Key[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'weekly' | 'monthly' | 'lifetime'>('monthly')
  const [quantity, setQuantity] = useState(1)
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [genMsg, setGenMsg] = useState('')
  const [generating, setGenerating] = useState(false)
  const [actionKeyId, setActionKeyId] = useState<string | null>(null)
  const { sorted: sortedKeys, sortKey, sortDir, toggle: toggleSort } = useSort(keys, 'createdAt')

  const [selectedKey, setSelectedKey] = useState<Key | null>(null)
  const [keyLoading, setKeyLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [userDialog, setUserDialog] = useState<{ open: boolean; loading: boolean; data: User | null }>({ open: false, loading: false, data: null })

  const isOwner = user?.role === 'owner'
  const isAdmin = user?.role === 'admin' || isOwner

  function mapKeys(raw: Record<string, unknown>[]) {
    return raw.map((k: Record<string, unknown>) => ({ id: (k.id || k._id) as string, ...k })) as Key[]
  }

  useEffect(() => {
    api.get('/keys').then((r) => {
      if (r.data.keys) setKeys(mapKeys(r.data.keys))
    }).catch(() => {}).finally(() => setLoading(false))
    if (isAdmin) {
      api.get('/admin/products').then((r) => {
        if (r.data.products) setProducts(r.data.products)
        else if (Array.isArray(r.data)) setProducts(r.data)
      }).catch(() => {})
    }
  }, [isAdmin])

  async function generateKeys() {
    setGenerating(true)
    setGenMsg('')
    try {
      const body: Record<string, unknown> = { type, quantity }
      if (selectedProductId) body.product = selectedProductId
      const r = await api.post('/keys/generate', body)
      if (r.data.keys) {
        setKeys((prev) => [...r.data.keys, ...prev])
        setGenMsg(`Generated ${r.data.keys.length} key(s)`)
        toast.success(`Generated ${r.data.keys.length} ${type} key(s)`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed'
      setGenMsg(msg)
      toast.error(msg)
    } finally { setGenerating(false) }
  }

  async function revokeKey(id: string) {
    setActionKeyId(id)
    try {
      await api.patch(`/keys/${id}/revoke`)
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'revoked' as const } : k)))
      if (selectedKey?.id === id) setSelectedKey((p) => p ? { ...p, status: 'revoked' as const } : p)
      toast.success('Key revoked')
    } catch { toast.error('Failed to revoke key') } finally { setActionKeyId(null) }
  }

  async function extendKey(id: string) {
    setActionKeyId(id)
    try {
      await api.patch(`/keys/${id}/extend`, { days: 30 })
      toast.success('Key extended by 30 days')
    } catch { toast.error('Failed to extend key') } finally { setActionKeyId(null) }
  }

  function openKey(target: Key) {
    setSelectedKey(null)
    setKeyLoading(true)
    setDialogOpen(true)
    api.get(`/keys/${target.id}`).then((r) => {
      const raw = r.data
      const mapped = { id: ((raw.id || raw._id) as string), ...raw } as Key
      if (mapped.owner && typeof mapped.owner === 'object') {
        const o = mapped.owner as unknown as Record<string, unknown>
        mapped.owner = { id: (o.id || o._id) as string, ...o } as Key['owner']
      }
      if (mapped.generatedBy && typeof mapped.generatedBy === 'object') {
        const g = mapped.generatedBy as unknown as Record<string, unknown>
        mapped.generatedBy = { id: (g.id || g._id) as string, username: g.username as string }
      }
      if (mapped.product && typeof mapped.product === 'object') {
        const p = mapped.product as unknown as Record<string, unknown>
        mapped.product = { id: (p.id || p._id) as string, slug: p.slug as string, name: p.name as string } as Product
      }
      setSelectedKey(mapped)
    }).catch(() => {}).finally(() => setKeyLoading(false))
  }

  function openUserInfo(userId: string) {
    setUserDialog({ open: true, loading: true, data: null })
    api.get(`/users/${userId}`).then((r) => {
      setUserDialog({ open: true, loading: false, data: r.data })
    }).catch(() => {
      setUserDialog({ open: true, loading: false, data: null })
      toast.error('Failed to load user info')
    })
  }

  function getProductDisplay(k: Key): string {
    if (!k.product) return '—'
    if (typeof k.product === 'object') return (k.product as Product).name || (k.product as Product).slug
    return String(k.product).slice(-8)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{isOwner ? 'All Keys' : 'My Keys'}</h1>

      {isOwner && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Generate Keys</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="weekly" value="weekly">Weekly</SelectItem>
                    <SelectItem key="monthly" value="monthly">Monthly</SelectItem>
                    <SelectItem key="lifetime" value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={selectedProductId} onValueChange={(v) => setSelectedProductId(v ?? '')}>
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue placeholder="No product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.slug}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min={1} max={50} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20" />
              </div>
              <Button onClick={generateKeys} disabled={generating || !selectedProductId}>{generating ? 'Generating...' : 'Generate'}</Button>
              {genMsg && <p className="text-sm text-muted-foreground">{genMsg}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex items-center gap-4 border-b border-border px-4 py-3 ${i === 4 ? 'border-b-0' : ''}`}>
                <div className="skeleton h-4 w-44" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="ml-auto flex gap-2">
                  <div className="skeleton h-7 w-7 rounded-md" />
                  <div className="skeleton h-7 w-7 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <RiTimeLine className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No keys found</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {isAdmin ? 'Generate keys using the form above.' : 'Purchase a key from our Discord or store to get started.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <SortableTh sortKey="keyValue" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Key</SortableTh>
                <SortableTh sortKey="type" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Type</SortableTh>
                <th className="px-4 py-3 text-left text-muted-foreground">Product</th>
                <SortableTh sortKey="status" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Status</SortableTh>
                {isAdmin && <th className="px-4 py-3 text-left text-muted-foreground">Owner</th>}
                <SortableTh sortKey="expiresAt" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Expires</SortableTh>
                <th className="px-4 py-3 text-right text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedKeys.map((k) => (
                <tr key={k.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="max-w-[160px] truncate font-mono text-xs text-foreground">{k.keyValue}</span>
                      <CopyButton text={k.keyValue} />
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{k.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {k.product && typeof k.product === 'object'
                      ? (k.product as Product).name || (k.product as Product).slug
                      : '—'}
                  </td>
                  <td className="px-4 py-3"><Badge variant={statusVariant(k.status)}>{k.status}</Badge></td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {k.owner && typeof k.owner === 'object' ? (
                        <button
                          className="text-xs text-primary underline-offset-2 hover:underline"
                          onClick={() => openUserInfo((k.owner as { id: string }).id)}
                        >
                          {(k.owner as { username?: string }).username || 'User'}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-muted-foreground">{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : (k.type === 'lifetime' ? 'Never' : '—')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="outline" size="icon-sm" onClick={() => openKey(k)} />}>
                          <RiEyeLine className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>View details</TooltipContent>
                      </Tooltip>
                      {isOwner && k.status !== 'revoked' && (
                        <Tooltip>
                          <TooltipTrigger render={<Button variant="outline" size="icon-sm" className="hover:border-red-500/50 hover:text-red-400" disabled={actionKeyId === k.id} onClick={() => revokeKey(k.id)} />}>
                            {actionKeyId === k.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <RiDeleteBinLine className="h-4 w-4" />}
                          </TooltipTrigger>
                          <TooltipContent>Revoke key</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Key Details</DialogTitle>
          </DialogHeader>

          {keyLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading key details...</p>
          ) : selectedKey ? (
            <>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="break-all font-mono text-sm text-foreground">{selectedKey.keyValue}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Type" value={selectedKey.type} capitalize />
                <DetailRow label="Status" value={selectedKey.status} capitalize />
                {selectedKey.product && typeof selectedKey.product === 'object' && (
                  <DetailRow label="Product" value={(selectedKey.product as Product).name || (selectedKey.product as Product).slug} />
                )}
                <DetailRow label="Expires" value={selectedKey.expiresAt ? new Date(selectedKey.expiresAt).toLocaleDateString() : (selectedKey.type === 'lifetime' ? 'Never' : '—')} />
                <DetailRow label="Used At" value={selectedKey.usedAt ? new Date(selectedKey.usedAt).toLocaleString() : 'Not used'} />
                <DetailRow label="Created" value={new Date(selectedKey.createdAt).toLocaleDateString()} />
                <DetailRow label="Key ID" value={selectedKey.id.slice(-12)} mono />
                {selectedKey.owner && typeof selectedKey.owner === 'object' && (
                  <ClickableDetailRow
                    label="Owner"
                    value={`${(selectedKey.owner as { username?: string }).username || '?'} (${(selectedKey.owner as { email?: string }).email || '?'})`}
                    onClick={() => openUserInfo((selectedKey.owner as { id: string }).id)}
                  />
                )}
                {selectedKey.generatedBy && (
                  <ClickableDetailRow
                    label="Generated By"
                    value={(selectedKey.generatedBy as { username?: string }).username || '?'}
                    onClick={() => openUserInfo((selectedKey.generatedBy as { id: string }).id)}
                  />
                )}
                {selectedKey.hwid && (
                  <DetailRow label="Bound HWID" value={selectedKey.hwid} mono />
                )}
                {selectedKey.notes && (
                  <DetailRow label="Notes" value={selectedKey.notes} />
                )}
                {selectedKey.hwidHistory && selectedKey.hwidHistory.length > 0 && (
                  <div className="col-span-2 rounded-lg border border-border bg-card px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">HWID History ({selectedKey.hwidHistory.length})</p>
                    <div className="mt-1 max-h-24 overflow-y-auto space-y-1">
                      {selectedKey.hwidHistory.map((h, i) => (
                        <p key={i} className="font-mono text-[11px] text-muted-foreground">
                          {h.hwid.substring(0, 12)}... bound {new Date(h.boundAt).toLocaleDateString()}{h.unboundAt ? ` → unbound ${new Date(h.unboundAt).toLocaleDateString()}` : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isOwner && selectedKey.status !== 'revoked' && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="destructive" disabled={actionKeyId === selectedKey.id} onClick={() => revokeKey(selectedKey.id)}>
                    {actionKeyId === selectedKey.id ? <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <RiDeleteBinLine className="mr-1.5 h-4 w-4" />}
                    {actionKeyId === selectedKey.id ? 'Revoking...' : 'Revoke Key'}
                  </Button>
                  <Button size="sm" variant="outline" disabled={actionKeyId === selectedKey.id} onClick={() => extendKey(selectedKey.id)}>
                    {actionKeyId === selectedKey.id ? <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <RiTimeLine className="mr-1.5 h-4 w-4" />}
                    {actionKeyId === selectedKey.id ? 'Extending...' : 'Extend 30 Days'}
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={userDialog.open} onOpenChange={(o) => setUserDialog((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Info</DialogTitle>
          </DialogHeader>
          {userDialog.loading ? (
            <p className="py-8 text-center text-muted-foreground">Loading user info...</p>
          ) : userDialog.data ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Username" value={userDialog.data.username} />
              <DetailRow label="Email" value={userDialog.data.email} />
              <DetailRow label="Role" value={userDialog.data.role} capitalize />
              <DetailRow label="Status" value={userDialog.data.status} capitalize />
              <DetailRow label="Created" value={new Date(userDialog.data.createdAt).toLocaleDateString()} />
              {userDialog.data.lastLogin && <DetailRow label="Last Login" value={new Date(userDialog.data.lastLogin).toLocaleString()} />}
              {userDialog.data.hwid && <DetailRow label="HWID" value={userDialog.data.hwid.substring(0, 16) + '...'} mono />}
              {'keyCount' in userDialog.data && (
                <DetailRow label="Keys" value={`${(userDialog.data as Record<string, unknown>).activeKeyCount || 0} active / ${(userDialog.data as Record<string, unknown>).keyCount || 0} total`} />
              )}
              {userDialog.data.suspendedUntil && <DetailRow label="Suspended Until" value={new Date(userDialog.data.suspendedUntil).toLocaleDateString()} />}
              {userDialog.data.suspensionReason && <DetailRow label="Suspension Reason" value={userDialog.data.suspensionReason} />}
              {userDialog.data.banReason && <DetailRow label="Ban Reason" value={userDialog.data.banReason} />}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">Failed to load user info</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({ label, value, capitalize, mono }: { label: string; value: string; capitalize?: boolean; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-medium text-foreground ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function ClickableDetailRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <button
        className="mt-0.5 text-sm font-medium text-primary underline-offset-2 hover:underline"
        onClick={onClick}
      >
        <RiUserLine className="mr-1 inline-block h-3.5 w-3.5" />
        {value}
      </button>
    </div>
  )
}
