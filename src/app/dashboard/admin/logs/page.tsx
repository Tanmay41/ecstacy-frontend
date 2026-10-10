'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { LogEntry } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SortableTh } from '@/components/ui/sortable-th'
import { useSort } from '@/hooks/useSort'

function renderTarget(log: LogEntry) {
  if (!log.targetModel) {
    if (log.actor?.email) return `${log.actor.email} (self)`
    return '—'
  }
  const target = log.targetId as any
  if (!target) return `${log.targetModel}(deleted)`
  if (log.targetModel === 'User') return `${target.username || target.email || '?'}`
  if (log.targetModel === 'Key') return `${target.keyValue || target._id?.slice(-6) || '?'}`
  if (log.targetModel === 'Product') return `${target.slug || target.name || target._id?.slice(-6) || '?'}`
  if (log.targetModel === 'ProductVersion') return `v${target.version || target._id?.slice(-6) || '?'}`
  if (log.targetModel === 'Screenshot') return `Report(${target._id?.slice(-6) || '?'})`
  return `${log.targetModel}(${target._id?.slice(-6) || '?'})`
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all text-foreground">{children || '—'}</span>
    </div>
  )
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [search, setSearch] = useState('')
  const { sorted: sortedLogs, sortKey, sortDir, toggle: toggleSort } = useSort(logs, 'createdAt')

  useEffect(() => {
    api.get(`/admin/logs?page=${page}&limit=50`).then((r) => {
      if (r.data.logs) setLogs(r.data.logs)
      if (r.data.totalPages) setTotalPages(r.data.totalPages)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [page])

  const filtered = search
    ? sortedLogs.filter((l) =>
        (l.message || l.action || '').toLowerCase().includes(search.toLowerCase()) ||
        l.actor?.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.actor?.username?.toLowerCase().includes(search.toLowerCase())
      )
    : sortedLogs

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-64 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No logs found</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                  <tr className="border-b border-border bg-muted">
                    <SortableTh sortKey="createdAt" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Time</SortableTh>
                    <SortableTh sortKey="actor.email" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Actor</SortableTh>
                    <SortableTh sortKey="message" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Action</SortableTh>
                    <SortableTh sortKey="targetModel" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>Target</SortableTh>
                    <SortableTh sortKey="ip" currentKey={sortKey} direction={sortDir} onToggle={toggleSort}>IP</SortableTh>
                  </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="cursor-pointer border-b border-border hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-foreground">{log.actor?.email || 'System'}</td>
                    <td className="px-4 py-3 text-foreground">{log.message || log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{renderTarget(log)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
          </div>
        </>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(open) => { if (!open) setSelectedLog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>Full information for this audit log entry</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3">
              <DetailRow label="Message">{selectedLog.message || selectedLog.action}</DetailRow>
              <DetailRow label="Action Code">
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{selectedLog.action}</span>
              </DetailRow>
              <DetailRow label="Time">{new Date(selectedLog.createdAt).toLocaleString()}</DetailRow>
              <DetailRow label="Actor">{selectedLog.actor?.email || 'System'}</DetailRow>
              <DetailRow label="Actor Role">{selectedLog.actor?.role || '—'}</DetailRow>
              <DetailRow label="Target Model">{selectedLog.targetModel || 'self'}</DetailRow>
              <DetailRow label="Target">{renderTarget(selectedLog)}</DetailRow>
              <DetailRow label="IP">{selectedLog.ip || '—'}</DetailRow>
              <DetailRow label="User Agent">{selectedLog.userAgent || '—'}</DetailRow>
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Details</span>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-foreground">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  )
}
