'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import type { User } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function BannedUsersPage() {
  const { user: me } = useAuth()
  const isOwner = me?.role === 'owner'

  const [banned, setBanned] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchBanned = useCallback(() => {
    setLoading(true)
    api.get('/users?status=banned').then((r) => {
      if (r.data.users) setBanned(r.data.users)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchBanned() }, [fetchBanned])

  async function handleSaveBanMessage(userId: string) {
    if (!editText.trim()) return
    setSaving(true)
    try {
      await api.patch(`/users/${userId}/ban-message`, { message: editText.trim() })
      setBanned((prev) => prev.map((u) => u.id === userId ? { ...u, banReason: editText.trim() } : u))
      setEditingId(null)
      setEditText('')
      toast.success('Ban message updated')
    } catch {
      toast.error('Failed to update ban message')
    } finally {
      setSaving(false)
    }
  }

  async function handleUnban(userId: string, username: string) {
    if (!confirm(`Unban ${username}?`)) return
    try {
      await api.patch(`/users/${userId}/status`, { status: 'active' })
      setBanned((prev) => prev.filter((u) => u.id !== userId))
      toast.success(`${username} has been unbanned`)
    } catch {
      toast.error('Failed to unban user')
    }
  }

  if (!isOwner) {
    return <p className="text-muted-foreground">Access denied.</p>
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Banned Users</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : banned.length === 0 ? (
        <p className="text-muted-foreground">No banned users.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-muted-foreground">Username</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Ban Message</th>
                <th className="px-4 py-3 text-right text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banned.map((u) => (
                <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-foreground">{u.username}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="destructive">banned</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Enter ban message..."
                        />
                        <Button size="sm" variant="default" onClick={() => handleSaveBanMessage(u.id)} disabled={saving}>
                          {saving ? '...' : 'Save'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditText('') }}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{u.banReason || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditingId(u.id); setEditText(u.banReason || '') }}
                      >
                        Edit Message
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:border-green-500/50 hover:text-green-400"
                        onClick={() => handleUnban(u.id, u.username)}
                      >
                        Unban
                      </Button>
                    </div>
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
