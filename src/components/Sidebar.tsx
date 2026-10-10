'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface NavLink {
  href: string
  label: string
  conditional?: boolean
}

const customerLinks: NavLink[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/download', label: 'Download' },
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/hwid', label: 'HWID' },
  { href: '/dashboard/keys', label: 'My Keys' },
]

const adminLinks: NavLink[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/hwid', label: 'HWID' },
  { href: '/dashboard/keys', label: 'Keys' },
  { href: '/dashboard/admin/products', label: 'Products' },
  { href: '/dashboard/users', label: 'Users' },
]

const ownerLinks: NavLink[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/users', label: 'Users' },
  { href: '/dashboard/keys', label: 'Keys' },
  { href: '/dashboard/admin/products', label: 'Products' },
  { href: '/dashboard/loader', label: 'Loader' },
  { href: '/dashboard/admin', label: 'Admins' },
  { href: '/dashboard/admin/banned', label: 'Banned', conditional: true },
  { href: '/dashboard/admin/screenshots', label: 'Reports' },
  { href: '/dashboard/admin/forensic', label: 'Events' },
  { href: '/dashboard/admin/sessions', label: 'Sessions' },
  { href: '/dashboard/admin/stats', label: 'Stats' },
  { href: '/dashboard/admin/logs', label: 'Logs' },
  { href: '/dashboard/admin/settings', label: 'Settings' },
  { href: '/dashboard/loader-test', label: 'Loader Test' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [bannedCount, setBannedCount] = useState<number | null>(null)

  useEffect(() => {
    if (user?.role !== 'owner') return
    function fetchCount() {
      api.get('/screenshots/pending-count').then((r) => {
        if (r.data.count !== undefined) setPendingCount(r.data.count)
      }).catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [user?.role])

  useEffect(() => {
    if (user?.role !== 'owner') return
    api.get('/users?status=banned&limit=1').then((r) => {
      if (r.data.total !== undefined) setBannedCount(r.data.total)
    }).catch(() => {})
  }, [user?.role])

  const links = user?.role === 'owner' ? ownerLinks
    : user?.role === 'admin' ? adminLinks
    : customerLinks

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <span className="text-xl text-primary">✦</span>
        <span className="text-lg font-bold text-sidebar-foreground">ecstacy</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => {
          if (link.conditional && (!bannedCount || bannedCount === 0)) return null
          const active = pathname === link.href
          const isScreenshots = link.href === '/dashboard/admin/screenshots'
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <span className="flex-1">{link.label}</span>
              {isScreenshots && pendingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-[11px] font-bold text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-sidebar-foreground">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
