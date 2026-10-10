'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { SortableTh } from '@/components/ui/sortable-th'
import { useSort } from '@/hooks/useSort'

const PRODUCT_TYPES = ['cheat', 'cleaner', 'spoofer', 'tool']

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ slug: '', name: '', type: 'cheat' })
  const { sorted: sortedProducts, sortKey, sortDir, toggle: toggleSort } = useSort(products, 'name')

  useEffect(() => {
    api.get('/admin/products').then((r) => {
      if (r.data.products) setProducts(r.data.products)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!form.slug || !form.name) return
    setCreating(true)
    try {
      await api.post('/admin/products', form)
      toast.success(`Product "${form.name}" created`)
      setForm({ slug: '', name: '', type: 'cheat' })
      setShowAdd(false)
      const r = await api.get('/admin/products')
      if (r.data.products) setProducts(r.data.products)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create product')
    } finally {
      setCreating(false)
    }
  }

  function autoSlug(name: string) {
    setForm((p) => ({ ...p, name, slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/products/${id}`)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success('Product deleted')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete')
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : 'Add Product'}
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-6">
          <CardHeader><CardTitle>New Product</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => autoSlug(e.target.value)} placeholder="ECSTACY External" required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="ecstacy-external" required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v ?? '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? 'Creating...' : 'Create Product'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {products.length === 0 ? (
        <p className="text-muted-foreground">No products yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <SortableTh sortKey="name" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Name</SortableTh>
                <SortableTh sortKey="slug" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Slug</SortableTh>
                <SortableTh sortKey="type" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Type</SortableTh>
                <th className="px-4 py-3 text-left text-muted-foreground">Versions</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((p) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/dashboard/admin/products/${p.id}`)}>
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{p.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.versionCount ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.enabled ? 'default' : 'secondary'}>{p.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="destructive" size="xs" onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name) }}>
                      Delete
                    </Button>
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
