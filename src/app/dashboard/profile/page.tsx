'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [discordLinked, setDiscordLinked] = useState(false)
  const [discordId, setDiscordId] = useState('')
  const [pendingCode, setPendingCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [discordLoading, setDiscordLoading] = useState(true)

  useEffect(() => {
    api.get('/discord/verification-status').then((r) => {
      setDiscordLinked(r.data.linked)
      setDiscordId(r.data.discordId || '')
      setPendingCode(r.data.pendingCode || '')
    }).catch(() => {}).finally(() => setDiscordLoading(false))
  }, [])

  async function handleVerifyCode() {
    if (!verifyCode.trim()) return
    setVerifyLoading(true)
    try {
      const r = await api.post('/discord/verify', { code: verifyCode.trim() })
      setDiscordLinked(true)
      setDiscordId(r.data.discordId || '')
      setPendingCode('')
      setVerifyCode('')
      toast.success('Discord account linked!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid code'
      toast.error(msg)
    } finally { setVerifyLoading(false) }
  }

  async function handleGenerateCode() {
    setGenerateLoading(true)
    try {
      const r = await api.post('/discord/generate-code')
      setGeneratedCode(r.data.code)
      setPendingCode('')
      toast.success('Code generated! Run /link in Discord')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to generate code'
      toast.error(msg)
    } finally { setGenerateLoading(false) }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    setError('')
    setLoading(true)
    try {
      await api.patch('/auth/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      await refreshUser()
      toast.success('Password changed successfully')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to change password'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-6xl">
      {user.status === 'suspended' && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
          <p className="text-sm font-medium text-yellow-400">Account Suspended</p>
          {user.suspensionReason && <p className="mt-0.5 text-xs text-yellow-300/80">Reason: {user.suspensionReason}</p>}
          {user.suspendedUntil && <p className="mt-0.5 text-xs text-yellow-300/80">Suspended until: {new Date(user.suspendedUntil).toLocaleDateString()}</p>}
          <p className="mt-1 text-xs text-yellow-300/60">You can still log into the dashboard, but the cheat is blocked.</p>
        </div>
      )}
      {user.status === 'banned' && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm font-medium text-red-400">Account Banned</p>
          {user.banReason && <p className="mt-0.5 text-xs text-red-300/80">Reason: {user.banReason}</p>}
          <p className="mt-1 text-xs text-red-300/60">You cannot use the cheat or access certain features.</p>
        </div>
      )}

      <div className="mb-8 flex items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 text-3xl font-bold text-primary ring-1 ring-primary/30">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.username}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account Details</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard label="Username" value={user.username} />
          <InfoCard label="Email" value={user.email} />
          <InfoCard label="Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
          <InfoCard label="Status" value={user.status.charAt(0).toUpperCase() + user.status.slice(1)} />
          <InfoCard label="HWID" value={user.hwid || 'Not set'} mono />
          <InfoCard label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'} />
          <InfoCard label="Member Since" value={new Date(user.createdAt).toLocaleDateString()} />
          <InfoCard label="Account ID" value={user.id.slice(-12)} mono />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Security</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
            <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
          </div>
          <form onSubmit={handlePasswordChange} className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">Current Password</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1" />
            </div>
            <div className="min-w-0 flex-[2]">
              <Label htmlFor="newPassword" className="text-xs text-muted-foreground">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="mt-1" />
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Update Password'}</Button>
          </form>
          {msg && <p className="mt-3 text-sm text-green-400">{msg}</p>}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Discord</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Link Discord Account</h3>
            <p className="text-xs text-muted-foreground">Link your Discord to get verified roles and enable account recovery</p>
          </div>

          {discordLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : discordLinked ? (
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Linked</Badge>
              <span className="font-mono text-xs text-muted-foreground">{discordId}</span>
              <span className="text-xs text-muted-foreground">Verified at linking</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Option 1: Generate code from dashboard, confirm in Discord */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                <p className="mb-2 text-xs font-medium text-foreground">Option 1: Start from Dashboard</p>
                <p className="mb-3 text-xs text-muted-foreground">Generate a code, then run <code className="font-mono text-xs bg-muted/50 px-1 rounded">/link YOUR_CODE</code> in Discord</p>
                {generatedCode ? (
                  <div>
                    <div className="mb-2 flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5">
                      <span className="text-xs text-muted-foreground">Your code:</span>
                      <span className="font-mono text-lg font-bold tracking-wider text-green-400">{generatedCode}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Run <code className="font-mono text-xs bg-muted/50 px-1 rounded">/link {generatedCode}</code> in any Discord channel with the bot to link your account.</p>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={handleGenerateCode} disabled={generateLoading}>
                    {generateLoading ? 'Generating...' : 'Generate Code'}
                  </Button>
                )}
              </div>

              {/* Option 2: Code from Discord, confirm on dashboard */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                <p className="mb-2 text-xs font-medium text-foreground">Option 2: Start from Discord</p>
                <p className="mb-3 text-xs text-muted-foreground">Run <code className="font-mono text-xs bg-muted/50 px-1 rounded">/verify YOUR_USERNAME</code> in Discord, then enter the code here</p>
                {pendingCode && (
                  <div className="mb-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
                    <p className="text-xs text-blue-400">You have a pending code from Discord. Enter it below.</p>
                  </div>
                )}
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-0 flex-1 max-w-[200px]">
                    <Label htmlFor="verifyCode" className="text-xs text-muted-foreground">Code from Discord</Label>
                    <Input id="verifyCode" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="e.g. ABC123" className="mt-1 font-mono" maxLength={8} />
                  </div>
                  <Button size="sm" onClick={handleVerifyCode} disabled={verifyLoading || !verifyCode.trim()}>
                    {verifyLoading ? 'Verifying...' : 'Link Discord'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
