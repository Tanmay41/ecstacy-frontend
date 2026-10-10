'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SortableTh } from '@/components/ui/sortable-th'
import { useSort } from '@/hooks/useSort'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<User[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [promoteUserId, setPromoteUserId] = useState<string>('')
  const [msg, setMsg] = useState('')
  const [promoting, setPromoting] = useState(false)
  const [demotingId, setDemotingId] = useState<string | null>(null)
  const { sorted: sortedAdmins, sortKey, sortDir, toggle: toggleSort } = useSort(admins.filter((a) => a.role === 'admin' || a.role === 'owner'), 'username')

  useEffect(() => {
    Promise.all([
      api.get('/admin/admins').then((r) => setAdmins(r.data.admins || [])),
      api.get('/users?role=customer').then((r) => setUsers(r.data.users || [])),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function promote() {
    if (!promoteUserId) return
    setPromoting(true)
    setMsg('')
    try {
      await api.post('/admin/admins', { userId: promoteUserId })
      setMsg('User promoted to admin')
      const u = users.find((x) => x.id === promoteUserId)
      if (u) {
        u.role = 'admin'
        setAdmins((prev) => [...prev, u])
        setUsers((prev) => prev.filter((x) => x.id !== promoteUserId))
      }
      setPromoteUserId('')
      toast.success('User promoted to admin')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed'
      setMsg(msg)
      toast.error(msg)
    } finally { setPromoting(false) }
  }

  async function demote(adminId: string) {
    setDemotingId(adminId)
    try {
      await api.delete(`/admin/admins/${adminId}`)
      const u = admins.find((x) => x.id === adminId)
      if (u) {
        u.role = 'customer'
        setAdmins((prev) => prev.filter((x) => x.id !== adminId))
        setUsers((prev) => [...prev, u])
      }
      toast.success('Admin demoted')
    } catch { toast.error('Failed to demote admin') } finally { setDemotingId(null) }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Admin Management</h1>
      <Card className="mb-8">
        <CardHeader><CardTitle>Promote User to Admin</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Select value={promoteUserId || undefined} onValueChange={(v) => setPromoteUserId(v || '')}>
                <SelectTrigger className="h-8 w-64">
                  <SelectValue placeholder="— Choose a customer —" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.email} ({u.username})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={promote} disabled={promoting}>{promoting ? 'Promoting...' : 'Promote'}</Button>
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          </div>
          {users.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No customers available to promote</p>}
        </CardContent>
      </Card>
      <h2 className="mb-3 text-lg font-semibold text-foreground">Current Admins</h2>
      {admins.filter((a) => a.role === 'admin' || a.role === 'owner').length === 0 ? (
        <p className="text-muted-foreground">No admins</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <SortableTh sortKey="username" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Username</SortableTh>
                <SortableTh sortKey="email" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Email</SortableTh>
                <SortableTh sortKey="role" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Role</SortableTh>
                <th className="px-4 py-3 text-left text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAdmins.map((a) => (
                <tr key={a.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-foreground">{a.username}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                  <td className="px-4 py-3 capitalize text-foreground">{a.role}</td>
                  <td className="px-4 py-3">
                    {a.role === 'admin' ? <Button variant="destructive" size="xs" disabled={demotingId === a.id} onClick={() => demote(a.id)}>{demotingId === a.id ? 'Demoting...' : 'Demote'}</Button> : <span className="text-xs text-muted-foreground">Owner</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
