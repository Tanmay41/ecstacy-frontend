'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { Product, ProductVersion, ProductCheck } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const VERSION_STATUSES = ['active', 'beta', 'deprecated'] as const

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [versions, setVersions] = useState<ProductVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showChecks, setShowChecks] = useState(false)
  const [checksForm, setChecksForm] = useState<ProductCheck[]>([])
  const [savingChecks, setSavingChecks] = useState(false)
  const [form, setForm] = useState<{ version: string; changelog: string; status: string; file: File | null }>({
    version: '',
    changelog: '',
    status: 'beta',
    file: null,
  })

  useEffect(() => {
    if (!params.id) return
    Promise.all([
      api.get(`/admin/products/${params.id}`).then((r) => {
        if (r.data.product) {
          setProduct(r.data.product)
          setChecksForm(r.data.product.checks ?? [])
        }
      }),
      api.get(`/admin/products/${params.id}/versions`).then((r) => {
        if (r.data.versions) setVersions(r.data.versions)
      }),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [params.id])

  async function handleUpload(e: FormEvent) {
    e.preventDefault()
    if (!form.version || !form.file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('version', form.version)
      formData.append('changelog', form.changelog)
      formData.append('status', form.status)
      formData.append('file', form.file)
      const res = await api.post(`/admin/products/${params.id}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(`Version ${form.version} uploaded`)
      setVersions((prev) => [res.data, ...prev])
      setForm({ version: '', changelog: '', status: 'beta', file: null })
      setShowUpload(false)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleStatusChange(versionId: string, newStatus: string) {
    try {
      await api.put(`/admin/products/${params.id}/versions/${versionId}`, { status: newStatus })
      setVersions((prev) =>
        prev.map((v) => {
          if (v.id === versionId) return { ...v, status: newStatus as ProductVersion['status'] }
          if (newStatus === 'active') return { ...v, status: v.id === versionId ? v.status : 'deprecated' }
          return v
        })
      )
      toast.success('Status updated')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status')
    }
  }

  async function handleDeleteVersion(versionId: string, version: string) {
    if (!confirm(`Delete version ${version}?`)) return
    try {
      await api.delete(`/admin/products/${params.id}/versions/${versionId}`)
      setVersions((prev) => prev.filter((v) => v.id !== versionId))
      toast.success('Version deleted')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete')
    }
  }

  async function handleSaveChecks() {
    if (!product) return
    setSavingChecks(true)
    try {
      const res = await api.put(`/admin/products/${product.id}`, { checks: checksForm })
      setProduct(res.data)
      toast.success('Pre-launch checks updated')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save checks')
    } finally {
      setSavingChecks(false)
    }
  }

  function addCheck() {
    setChecksForm((prev) => [...prev, { type: 'process_running', value: '', label: '', failMessage: '', hideLoader: false }])
  }

  function removeCheck(index: number) {
    setChecksForm((prev) => prev.filter((_, i) => i !== index))
  }

  function updateCheck(index: number, field: keyof ProductCheck, val: string | boolean) {
    setChecksForm((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: val } : c)))
  }

  async function handleToggleEnabled() {
    if (!product) return
    try {
      const res = await api.put(`/admin/products/${product.id}`, { enabled: !product.enabled })
      setProduct(res.data)
      toast.success(`Product ${res.data.enabled ? 'enabled' : 'disabled'}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update')
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>
  if (!product) return <p className="text-muted-foreground">Product not found</p>

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="outline" size="xs" className="mb-2" onClick={() => router.push('/dashboard/admin/products')}>
            &larr; Back to Products
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <p className="text-sm text-muted-foreground">/{product.slug} &middot; {product.type}</p>
        </div>
        <Button variant={product.enabled ? 'secondary' : 'default'} size="sm" onClick={handleToggleEnabled}>
          {product.enabled ? 'Disable' : 'Enable'}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pre-Launch Checks</CardTitle>
          <Button variant="outline" size="xs" onClick={() => setShowChecks(!showChecks)}>
            {showChecks ? 'Done' : 'Edit'}
          </Button>
        </CardHeader>
        <CardContent>
          {product.checks && product.checks.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {product.checks.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{c.type}</Badge>
                  <span>{c.label || c.value}</span>
                  {c.hideLoader && <Badge variant="secondary" className="text-xs">hide loader</Badge>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No pre-launch checks configured</p>
          )}

          {showChecks && (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              {checksForm.map((c, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Check #{i + 1}</span>
                    <Button variant="destructive" size="xs" onClick={() => removeCheck(i)}>Remove</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={c.type} onValueChange={(v) => updateCheck(i, 'type', v ?? 'process_running')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="process_running">Process Running</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Process Name</Label>
                      <Input value={c.value} onChange={(e) => updateCheck(i, 'value', e.target.value)} placeholder="FiveM.exe" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input value={c.label} onChange={(e) => updateCheck(i, 'label', e.target.value)} placeholder="FiveM" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Error Message</Label>
                      <Input value={c.failMessage} onChange={(e) => updateCheck(i, 'failMessage', e.target.value)} placeholder="FiveM is not running" />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id={`hide-${i}`}
                        checked={c.hideLoader}
                        onChange={(e) => updateCheck(i, 'hideLoader', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`hide-${i}`} className="text-xs cursor-pointer">Hide & quit loader after launching</Label>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addCheck}>+ Add Check</Button>
                <Button size="sm" onClick={handleSaveChecks} disabled={savingChecks}>
                  {savingChecks ? 'Saving...' : 'Save Checks'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Versions ({versions.length})</h2>
        <Button onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? 'Cancel' : 'Upload Version'}
        </Button>
      </div>

      {showUpload && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Upload New Version</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Version (semver, e.g. 1.0.0)</Label>
                <Input
                  value={form.version}
                  onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
                  placeholder="1.0.0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Changelog</Label>
                <Textarea
                  value={form.changelog}
                  onChange={(e) => setForm((p) => ({ ...p, changelog: e.target.value }))}
                  placeholder="What's new..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v ?? '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VERSION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Product Executable</Label>
                <Input
                  type="file"
                  accept=".exe,.dll"
                  onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] ?? null }))}
                  required
                />
                {form.file && <p className="text-sm text-muted-foreground">{form.file.name} ({(form.file.size / 1024 / 1024).toFixed(2)} MB)</p>}
                <p className="text-xs text-muted-foreground">Upload the plain EXE/DLL binary. The server will encrypt it with AES-256-CBC and store it securely.</p>
              </div>
              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? 'Encrypting & Uploading...' : 'Upload & Encrypt'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {versions.length === 0 ? (
        <p className="text-muted-foreground">No versions uploaded for this product</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {versions.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-mono text-sm">v{v.version}</CardTitle>
                  <Badge variant={v.status === 'active' ? 'default' : v.status === 'beta' ? 'secondary' : 'outline'}>
                    {v.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Downloads: {v.downloadCount}</p>
                <p className="text-sm text-muted-foreground">Size: {(v.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                {v.changelog && <p className="text-xs text-muted-foreground line-clamp-2">{v.changelog}</p>}
                <p className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-2 pt-2">
                  {VERSION_STATUSES.filter((s) => s !== v.status).map((s) => (
                    <Button key={s} variant="outline" size="xs" onClick={() => handleStatusChange(v.id, s)}>
                      Set {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                  <Button variant="destructive" size="xs" onClick={() => handleDeleteVersion(v.id, v.version)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
