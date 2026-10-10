'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function LoaderAuthTestPage() {
  const { user } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [hwid, setHwid] = useState('')
  const [product, setProduct] = useState('ecstacy-external')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    data?: any
    error?: string
    status?: number
  } | null>(null)
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean
    data?: any
    error?: string
    status?: number
  } | null>(null)
  const [token, setToken] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setVerifyResult(null)
    try {
      const res = await api.post('/loader/login', { username, password, hwid })
      setResult({ success: true, data: res.data, status: res.status })
      if (res.data.token) {
        setToken(res.data.token)
        toast.success('Login successful')
      }
    } catch (err: any) {
      setResult({ success: false, error: err.response?.data?.error || err.message, status: err.response?.status })
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!token) return
    setVerifyResult(null)
    try {
      const res = await api.post('/loader/verify', { hwid, product }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVerifyResult({ success: true, data: res.data, status: res.status })
      toast.success('Verify successful')
    } catch (err: any) {
      setVerifyResult({ success: false, error: err.response?.data?.error || err.message, status: err.response?.status })
      toast.error(err.response?.data?.error || 'Verify failed')
    }
  }

  async function handleDownload() {
    if (!verifyResult?.data?.downloadToken) return
    try {
      const res = await api.get(`/loader/download/${verifyResult.data.downloadToken}`, {
        responseType: 'blob'
      })
      toast.success(`Downloaded ${res.data.size} bytes`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Download failed')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Loader Auth Test</h1>
      <p className="text-muted-foreground">Test POST /api/loader/login and verify endpoints</p>

      <Card>
        <CardHeader>
          <CardTitle>Login Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="testuser" required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password123" required />
            </div>
            <div className="space-y-2">
              <Label>HWID (64-char hex)</Label>
              <Input value={hwid} onChange={(e) => setHwid(e.target.value)} placeholder="a1b2c3d4..." maxLength={64} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {result && (
            <div className={`rounded-lg border p-4 ${result.success ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? 'Success' : 'Error'} {result.status ? `(${result.status})` : ''}
                </Badge>
              </div>
              <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap">{JSON.stringify(result.data || result.error, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {token && (
        <Card>
          <CardHeader>
            <CardTitle>Verify & Download</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Slug</Label>
              <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="ecstacy-external" />
            </div>
            <div className="space-y-2">
              <Label>HWID for verify</Label>
              <Input value={hwid} onChange={(e) => setHwid(e.target.value)} placeholder="same HWID as login" maxLength={64} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleVerify} disabled={!token}>Verify</Button>
              <Button onClick={handleDownload} disabled={!verifyResult?.data?.downloadToken} variant="outline">Download Menu</Button>
            </div>

            {verifyResult && (
              <div className={`rounded-lg border p-4 ${verifyResult.success ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={verifyResult.success ? 'default' : 'destructive'}>
                    {verifyResult.success ? 'Success' : 'Error'} {verifyResult.status ? `(${verifyResult.status})` : ''}
                  </Badge>
                </div>
                <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap">{JSON.stringify(verifyResult.data || verifyResult.error, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-muted/50">
        <CardHeader>
          <CardTitle>Quick Test Scenarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Valid login:</strong> Register a user first, then use their credentials + any 64-char HWID</li>
            <li><strong>Wrong password:</strong> Correct username, wrong password</li>
            <li><strong>Non-existent user:</strong> Random username</li>
            <li><strong>HWID mismatch:</strong> Login with one HWID, verify with different HWID</li>
            <li><strong>Banned user:</strong> Ban a user via Users page, then try login</li>
            <li><strong>Suspended user:</strong> Suspend a user, then try login</li>
            <li><strong>Invalid HWID format:</strong> Non-64-char or non-hex</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}