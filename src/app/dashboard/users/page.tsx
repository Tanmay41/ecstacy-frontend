'use client'

import React from 'react'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import type { User, Key, Product } from '@/types'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
import {
  RiEyeLine,
  RiTimeLine,
  RiDeleteBinLine,
  RiForbidLine,
  RiLockUnlockLine,
  RiAddLine,
} from '@remixicon/react'
import { DatePicker } from '@/components/ui/date-picker'
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
    case 'suspended': return 'outline' as const
    case 'banned': return 'destructive' as const
    default: return 'default' as const
  }
}

const keyStatusVariant = (s: string) => {
  switch (s) {
    case 'active': return 'default' as const
    case 'used': return 'secondary' as const
    case 'expired': return 'outline' as const
    default: return 'destructive' as const
  }
}

const KEY_TYPES = ['weekly', 'monthly', 'lifetime', 'custom'] as const

export default function UsersPage() {
  const { user: me } = useAuth()
  const isOwner = me?.role === 'owner'
  const isAdmin = me?.role === 'admin'
  const canManageUsers = isOwner || isAdmin

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const { sorted: sortedUsers, sortKey, sortDir, toggle: toggleSort } = useSort(users, 'username', {
    role: ['owner', 'admin', 'customer'],
    status: ['active', 'suspended', 'banned'],
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userKeys, setUserKeys] = useState<Key[]>([])
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')

  const [giveForm, setGiveForm] = useState(false)
  const [giveType, setGiveType] = useState<string>('monthly')
  const [giveDuration, setGiveDuration] = useState('30')
  const [giveProduct, setGiveProduct] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [giving, setGiving] = useState(false)

  const [extendDays, setExtendDays] = useState<Record<string, string>>({})
  const [extendingKeyId, setExtendingKeyId] = useState<string | null>(null)

  const [confirm, setConfirm] = useState<{
    open: boolean
    title: string
    description: string
    targetUser: User | null
    handler: () => void
    confirmText?: string
    variant?: 'default' | 'destructive'
  }>({ open: false, title: '', description: '', targetUser: null, handler: () => {} })
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [actionReason, setActionReason] = useState('')
  const [actionSuspendedUntil, setActionSuspendedUntil] = useState('')

  const closeConfirm = () => {
    setConfirm((p) => ({ ...p, open: false }))
    setActionReason('')
    setActionSuspendedUntil('')
  }

  const fetchUsers = useCallback(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    api.get(`/users${params}`).then((r) => {
      if (r.data.users) setUsers(r.data.users)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function openUser(target: User) {
    setSelectedUser(target)
    setUserKeys([])
    setUserError('')
    setGiveForm(false)
    setGiveType('monthly')
    setGiveDuration('30')
    setGiveProduct('')
    setExtendDays({})
    setDialogOpen(true)
    api.get('/admin/products').then((r) => {
      if (r.data.products) setProducts(r.data.products)
      else if (Array.isArray(r.data)) setProducts(r.data)
    }).catch(() => {})
    setUserLoading(true)
    api.get(`/users/${target.id}`).then((r) => {
      const u = r.data.user || r.data
      setSelectedUser(u)
      if (u.keys) setUserKeys(u.keys)
    }).catch(() => setUserError('Failed to load user details')).finally(() => setUserLoading(false))
  }

  function askSuspend(target: User) {
    if (target.status === 'suspended') {
      setConfirm({
        open: true,
        title: 'Unsuspend User',
        description: 'This will restore the user\'s access to the menu and all associated services.',
        targetUser: target,
        handler: async () => {
          setConfirmLoading(true)
          try {
            await api.patch(`/users/${target.id}/status`, { status: 'active' })
            setUsers((prev) => prev.map((u) => u.id === target.id ? { ...u, status: 'active' as User['status'] } : u))
            setSelectedUser((prev) => prev?.id === target.id ? { ...prev, status: 'active' as User['status'], suspensionReason: '', suspendedUntil: undefined } : prev)
            toast.success(`${target.username} has been unsuspended`)
          } catch { toast.error('Failed to unsuspend user') } finally { setConfirmLoading(false); closeConfirm() }
        },
        confirmText: 'Unsuspend',
        variant: 'default',
      })
      return
    }
    setActionReason('')
    setActionSuspendedUntil('')
    setConfirm({
      open: true,
      title: 'Suspend User',
      description: 'This will restrict the user from accessing the menu. They can still log into the dashboard.',
      targetUser: target,
      handler: async () => {
        setConfirmLoading(true)
        try {
          const body: { status: string; reason?: string; suspendedUntil?: string } = { status: 'suspended' }
          if (actionReason) body.reason = actionReason
          if (actionSuspendedUntil) body.suspendedUntil = actionSuspendedUntil
          await api.patch(`/users/${target.id}/status`, body)
          setUsers((prev) => prev.map((u) => u.id === target.id ? { ...u, status: 'suspended' as User['status'] } : u))
          setSelectedUser((prev) => prev?.id === target.id ? { ...prev, status: 'suspended' as User['status'], suspensionReason: actionReason, suspendedUntil: actionSuspendedUntil || undefined } : prev)
          toast.success(`${target.username} has been suspended`)
        } catch { toast.error('Failed to suspend user') } finally { setConfirmLoading(false); closeConfirm() }
      },
      confirmText: 'Suspend',
      variant: 'destructive',
    })
  }

  function askBan(target: User) {
    setActionReason('')
    setConfirm({
      open: true,
      title: 'Ban User',
      description: 'This is a permanent action. The user will lose all access immediately.',
      targetUser: target,
      handler: async () => {
        setConfirmLoading(true)
        try {
          const body: { status: string; reason?: string } = { status: 'banned' }
          if (actionReason) body.reason = actionReason
          await api.patch(`/users/${target.id}/status`, body)
          setUsers((prev) => prev.map((u) => u.id === target.id ? { ...u, status: 'banned' as User['status'] } : u))
          setSelectedUser((prev) => prev?.id === target.id ? { ...prev, status: 'banned' as User['status'], banReason: actionReason } : prev)
          toast.success(`${target.username} has been banned`)
        } catch { toast.error('Failed to ban user') } finally { setConfirmLoading(false); closeConfirm() }
      },
      confirmText: 'Ban User',
      variant: 'destructive',
    })
  }

  function askResetHwid(target: User) {
    setConfirm({
      open: true,
      title: 'Reset HWID',
      description: 'This will clear the user\'s HWID lock, allowing them to authenticate from a different machine. The previous HWID will be logged.',
      targetUser: target,
      handler: async () => {
        setConfirmLoading(true)
        try {
          await api.post(`/hwid/admin-reset/${target.id}`, { reason: 'Reset via admin panel' })
          setSelectedUser((prev) => prev?.id === target.id ? { ...prev, hwid: undefined } : prev)
          toast.success(`HWID reset for ${target.username}`)
        } catch { toast.error('Failed to reset HWID') } finally { setConfirmLoading(false); closeConfirm() }
      },
      confirmText: 'Reset HWID',
      variant: 'destructive',
    })
  }

  function askRevokeKey(keyId: string) {
    const key = userKeys.find((k) => k.id === keyId)
    if (!key) return
    setConfirm({
      open: true,
      title: 'Revoke Key',
      description: `This will permanently revoke the key ${key.keyValue}. The user will lose access immediately. This action cannot be undone.`,
      targetUser: selectedUser,
      handler: async () => {
        setConfirmLoading(true)
        try {
          await api.patch(`/keys/${keyId}/revoke`)
          setUserKeys((prev) => prev.map((k) => k.id === keyId ? { ...k, status: 'revoked' as Key['status'] } : k))
        } catch { /* ignore */ } finally { setConfirmLoading(false); closeConfirm() }
      },
      confirmText: 'Revoke Key',
      variant: 'destructive',
    })
  }

  async function handleGiveLicense(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    setGiving(true)
    try {
      const body: { type: string; duration?: string; product?: string } = { type: giveType }
      if (giveType === 'custom') body.duration = giveDuration
      if (giveProduct) body.product = giveProduct
      const r = await api.post(`/users/${selectedUser.id}/assign-key`, body)
      if (r.data.key) setUserKeys((prev) => [r.data.key, ...prev])
      setGiveForm(false)
      toast.success(`${giveType} key assigned to ${selectedUser.username}`)
    } catch { toast.error('Failed to assign key') } finally { setGiving(false) }
  }

  async function extendKey(keyId: string) {
    const days = extendDays[keyId]
    if (!days || parseInt(days) < 1) return
    setExtendingKeyId(keyId)
    try {
      await api.patch(`/keys/${keyId}/extend`, { days: parseInt(days) })
      setUserKeys((prev) => prev.map((k) => k.id === keyId ? { ...k, status: 'active' as Key['status'] } : k))
      setExtendDays((prev) => ({ ...prev, [keyId]: '' }))
      toast.success(`Key extended by ${days} days`)
    } catch { toast.error('Failed to extend key') } finally { setExtendingKeyId(null) }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Users</h1>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email or username..."
        className="mb-4 max-w-sm"
      />

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground">No users found</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <SortableTh sortKey="username" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Username</SortableTh>
                <SortableTh sortKey="email" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Email</SortableTh>
                <SortableTh sortKey="role" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Role</SortableTh>
                <SortableTh sortKey="status" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Status</SortableTh>
                <th className="px-4 py-3 text-right text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-foreground">{u.username}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{u.role}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(u.status)}>{u.status}</Badge>
                    {(u.status === 'suspended' || u.status === 'banned') && (u.suspensionReason || u.banReason) && (
                      <p className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">
                        {u.suspensionReason || u.banReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="outline" size="icon-sm" onClick={() => openUser(u)} />}>
                          <RiEyeLine className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>View details</TooltipContent>
                      </Tooltip>
                      {canManageUsers && u.role !== 'owner' && u.role !== 'admin' && u.status !== 'banned' && (
                        <Tooltip>
                          <TooltipTrigger render={<Button variant="outline" size="icon-sm" className="hover:border-yellow-500/50 hover:text-yellow-400" onClick={() => askSuspend(u)} />}>
                            <RiForbidLine className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>{u.status === 'suspended' ? 'Unsuspend user' : 'Suspend user'}</TooltipContent>
                        </Tooltip>
                      )}
                      {canManageUsers && u.role !== 'owner' && u.role !== 'admin' && u.status !== 'banned' && (
                        <Tooltip>
                          <TooltipTrigger render={<Button variant="outline" size="icon-sm" className="hover:border-red-500/50 hover:text-red-400" onClick={() => askBan(u)} />}>
                            <RiDeleteBinLine className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Ban user</TooltipContent>
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

      {/***** User Detail Dialog *****/}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.username}
              <span className="ml-2 text-sm font-normal text-muted-foreground">{selectedUser?.email}</span>
            </DialogTitle>
          </DialogHeader>

          {userLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading user details...</p>
          ) : userError ? (
            <p className="py-8 text-center text-destructive">{userError}</p>
          ) : selectedUser ? (
            <React.Fragment>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Role" value={selectedUser.role} capitalize />
                <InfoRow label="Status" value={selectedUser.status} capitalize />
                <InfoRow label="HWID" value={selectedUser.hwid || 'Not set'} mono />
                <InfoRow label="Last Login" value={selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'} />
                <InfoRow label="Member Since" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
                <InfoRow label="User ID" value={selectedUser.id} mono />
                {selectedUser.status === 'suspended' && selectedUser.suspensionReason && (
                  <InfoRow label="Suspension Reason" value={selectedUser.suspensionReason} />
                )}
                {selectedUser.status === 'suspended' && selectedUser.suspendedUntil && (
                  <InfoRow label="Suspended Until" value={new Date(selectedUser.suspendedUntil).toLocaleDateString()} />
                )}
                {selectedUser.status === 'banned' && selectedUser.banReason && (
                  <InfoRow label="Ban Reason" value={selectedUser.banReason} />
                )}
              </div>

              {canManageUsers && (
                <React.Fragment>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedUser.role !== 'owner' && selectedUser.status !== 'banned' && (
                      <Button
                        size="sm"
                        variant={selectedUser.status === 'suspended' ? 'default' : 'outline'}
                        onClick={() => askSuspend(selectedUser)}
                        disabled={isAdmin && selectedUser.status === 'suspended'}
                      >
                        <RiForbidLine className="mr-1.5 h-4 w-4" />
                        {selectedUser.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                      </Button>
                    )}
                    {selectedUser.role !== 'owner' && selectedUser.status !== 'banned' && (
                      <Button size="sm" variant="destructive" onClick={() => askBan(selectedUser)}>
                        <RiDeleteBinLine className="mr-1.5 h-4 w-4" />
                        Ban
                      </Button>
                    )}
                    {selectedUser.status === 'banned' && selectedUser.role !== 'owner' && isOwner && (
                      <Button size="sm" variant="outline" onClick={() => askSuspend(selectedUser)}>
                        <RiLockUnlockLine className="mr-1.5 h-4 w-4" />
                        Unban
                      </Button>
                    )}
                    {isOwner && selectedUser.hwid && (
                      <Button size="sm" variant="secondary" onClick={() => askResetHwid(selectedUser)}>
                        <RiLockUnlockLine className="mr-1.5 h-4 w-4" />
                        Reset HWID
                      </Button>
                    )}
                    {isOwner && (
                      <Button size="sm" variant="outline" onClick={() => setGiveForm(!giveForm)}>
                        <RiAddLine className="mr-1.5 h-4 w-4" />
                        Give License
                      </Button>
                    )}
                  </div>

                  {giveForm && (
                    <form onSubmit={handleGiveLicense} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/40 p-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <Select value={giveType} onValueChange={(v) => setGiveType(v || 'monthly')}>
                          <SelectTrigger className="mt-1 h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {KEY_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Product</Label>
                        <Select value={giveProduct} onValueChange={(v) => setGiveProduct(v ?? '')}>
                          <SelectTrigger className="mt-1 h-8 w-40">
                            <SelectValue placeholder="No product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.slug}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {giveType === 'custom' && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Days</Label>
                          <Input type="number" min={1} max={365} value={giveDuration} onChange={(e) => setGiveDuration(e.target.value)} required className="mt-1 w-24" />
                        </div>
                      )}
                      <Button type="submit" size="sm" disabled={giving || !giveProduct}>{giving ? 'Creating...' : 'Assign Key'}</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setGiveForm(false)}>Cancel</Button>
                    </form>
                  )}
                </React.Fragment>
              )}

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Keys ({userKeys.length})
                </h3>
                {userKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No keys assigned</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted">
                          <th className="px-3 py-2 text-left text-muted-foreground">Key</th>
                          <th className="px-3 py-2 text-left text-muted-foreground">Type</th>
                          <th className="px-3 py-2 text-left text-muted-foreground">Status</th>
                          <th className="px-3 py-2 text-left text-muted-foreground">Expires</th>
                          {isOwner && <th className="px-3 py-2 text-right text-muted-foreground">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {userKeys.map((k) => (
                          <tr key={k.id} className="border-b border-border">
                            <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs text-foreground">{k.keyValue}</td>
                            <td className="px-3 py-2 capitalize text-muted-foreground">{k.type}</td>
                            <td className="px-3 py-2"><Badge variant={keyStatusVariant(k.status)}>{k.status}</Badge></td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : (k.type === 'lifetime' ? 'Never' : '—')}
                            </td>
                            {isOwner && (
                              <td className="px-3 py-2 text-right">
                                <div className="inline-flex items-center gap-1">
                                  {k.status !== 'revoked' && k.status !== 'expired' && (
                                    <>
                                      <Input
                                        type="number"
                                        min={1}
                                        max={365}
                                        placeholder="Days"
                                        value={extendDays[k.id] || ''}
                                        onChange={(e) => setExtendDays((prev) => ({ ...prev, [k.id]: e.target.value }))}
                                        className="h-7 w-16 text-xs"
                                      />
                                      <Tooltip>
                                        <TooltipTrigger render={<Button variant="outline" size="icon-sm" className="hover:border-blue-500/50 hover:text-blue-400" disabled={extendingKeyId === k.id} onClick={() => extendKey(k.id)} />}>
                                          {extendingKeyId === k.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <RiTimeLine className="h-4 w-4" />}
                                        </TooltipTrigger>
                                        <TooltipContent>{extendingKeyId === k.id ? 'Extending...' : 'Extend key'}</TooltipContent>
                                      </Tooltip>
                                    </>
                                  )}
                                  {k.status !== 'revoked' && (
                                    <Tooltip>
                                      <TooltipTrigger render={<Button variant="outline" size="icon-sm" className="hover:border-red-500/50 hover:text-red-400" onClick={() => askRevokeKey(k.id)} />}>
                                        <RiDeleteBinLine className="h-4 w-4" />
                                      </TooltipTrigger>
                                      <TooltipContent>Revoke key</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </React.Fragment>
          ) : null}
        </DialogContent>
      </Dialog>

      {/***** Confirmation Dialog *****/}
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => { setConfirm((p) => ({ ...p, open: o })); if (!o) { setActionReason(''); setActionSuspendedUntil('') } }}
        title={confirm.title}
        description={confirm.description}
        user={confirm.targetUser}
        confirmText={confirm.confirmText}
        variant={confirm.variant}
        onConfirm={confirm.handler}
        loading={confirmLoading}
      >
        {(confirm.title === 'Suspend User' || confirm.title === 'Ban User') && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Reason</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {confirm.title === 'Suspend User' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Suspended until (optional)</label>
                <div className="mt-1">
                  <DatePicker value={actionSuspendedUntil} onChange={setActionSuspendedUntil} min={new Date()} />
                </div>
              </div>
            )}
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}

function InfoRow({ label, value, capitalize, mono }: { label: string; value: string; capitalize?: boolean; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-medium text-foreground ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}