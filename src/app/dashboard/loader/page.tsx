'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { RiDownloadLine } from '@remixicon/react'

interface LoaderInfo {
  exists: boolean
  fileSize?: number
  fileName?: string
  uploadedAt?: string
}

export default function LoaderManagementPage() {
  const [info, setInfo] = useState<LoaderInfo>({ exists: false })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchInfo()
  }, [])

  async function fetchInfo() {
    try {
      const res = await api.get('/loader/info')
      setInfo(res.data)
    } catch {
      setInfo({ exists: false })
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      await api.post('/loader/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Loader uploaded successfully')
      setSelectedFile(null)
      fetchInfo()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      const r = await api.get('/loader/download/loader.exe', {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'ecstacy-loader.exe'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Download started')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Download failed')
    } finally {
      setDownloading(false)
    }
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Loader Management</h1>
      <p className="text-muted-foreground">Upload and manage the loader EXE for distribution</p>

      <Card>
        <CardHeader>
          <CardTitle>Current Loader</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Checking...</p>
          ) : info.exists ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{info.fileName}</span>
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                  {downloading ? (
                    <span className="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <RiDownloadLine className="mr-1.5 h-4 w-4" />
                  )}
                  {downloading ? 'Downloading...' : 'Download'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Size: {info.fileSize ? `${(info.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
              {info.uploadedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Uploaded: {new Date(info.uploadedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No loader uploaded yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Loader</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>Loader EXE</Label>
              <Input type="file" accept=".exe" onChange={handleFileChange} required />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <Button type="submit" disabled={uploading || !selectedFile} className="w-full">
              {uploading ? 'Uploading...' : 'Upload Loader'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-muted/50">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <ul className="list-disc list-inside space-y-1">
            <li>Customers download the loader from their <a href="/dashboard/download" className="text-primary hover:underline">Download page</a> after logging in.</li>
            <li>Customers must have an active license key to download (auth + license gated).</li>
            <li>Only one loader can be stored at a time (overwrites previous).</li>
            <li>Owner only can upload; customers/admins cannot access this page.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}