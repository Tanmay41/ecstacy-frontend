'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import {
  RiDashboard3Line, RiDownload2Line, RiUser3Line, RiKey2Line, RiMacbookLine,
  RiSettings3Line, RiUserSearchLine, RiShutDownLine, RiDatabase2Line,
  RiServerLine, RiBarChart2Line, RiFileList3Line, RiLoader4Line,
  RiScreenshot2Line, RiAlertLine, RiGroupLine, RiFunctionLine, RiMenuLine,
  RiLogoutBoxLine, RiCloseLine,
} from '@remixicon/react'

interface NavSection {
  label: string
  links: { href: string; label: string; icon: React.ReactNode; conditional?: boolean }[]
}

const customerSections: NavSection[] = [
  {
    label: 'Overview',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: <RiDashboard3Line size={16} /> },
    ],
  },
  {
    label: 'Product',
    links: [
      { href: '/dashboard/download', label: 'Download', icon: <RiDownload2Line size={16} /> },
      { href: '/dashboard/keys', label: 'My Keys', icon: <RiKey2Line size={16} /> },
    ],
  },
  {
    label: 'Account',
    links: [
      { href: '/dashboard/profile', label: 'Profile', icon: <RiUser3Line size={16} /> },
      { href: '/dashboard/hwid', label: 'HWID', icon: <RiMacbookLine size={16} /> },
    ],
  },
]

const adminSections: NavSection[] = [
  {
    label: 'Overview',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: <RiDashboard3Line size={16} /> },
    ],
  },
  {
    label: 'Account',
    links: [
      { href: '/dashboard/profile', label: 'Profile', icon: <RiUser3Line size={16} /> },
      { href: '/dashboard/hwid', label: 'HWID', icon: <RiMacbookLine size={16} /> },
    ],
  },
  {
    label: 'Management',
    links: [
      { href: '/dashboard/download', label: 'Download', icon: <RiDownload2Line size={16} /> },
      { href: '/dashboard/keys', label: 'Keys', icon: <RiKey2Line size={16} /> },
      { href: '/dashboard/admin/products', label: 'Products', icon: <RiDatabase2Line size={16} /> },
      { href: '/dashboard/users', label: 'Users', icon: <RiUserSearchLine size={16} /> },
    ],
  },
]

const ownerSections: NavSection[] = [
  {
    label: 'Overview',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: <RiDashboard3Line size={16} /> },
      { href: '/dashboard/admin/stats', label: 'Statistics', icon: <RiBarChart2Line size={16} /> },
    ],
  },
  {
    label: 'Account',
    links: [
      { href: '/dashboard/profile', label: 'Profile', icon: <RiUser3Line size={16} /> },
      { href: '/dashboard/hwid', label: 'HWID', icon: <RiMacbookLine size={16} /> },
    ],
  },
  {
    label: 'Management',
    links: [
      { href: '/dashboard/keys', label: 'Keys', icon: <RiKey2Line size={16} /> },
      { href: '/dashboard/admin/products', label: 'Products', icon: <RiDatabase2Line size={16} /> },
      { href: '/dashboard/users', label: 'Users', icon: <RiUserSearchLine size={16} /> },
      { href: '/dashboard/admin/banned', label: 'Banned', icon: <RiShutDownLine size={16} />, conditional: true },
    ],
  },
  {
    label: 'Security',
    links: [
      { href: '/dashboard/admin/screenshots', label: 'Reports', icon: <RiScreenshot2Line size={16} /> },
      { href: '/dashboard/admin/forensic', label: 'Events', icon: <RiAlertLine size={16} /> },
      { href: '/dashboard/admin/sessions', label: 'Sessions', icon: <RiServerLine size={16} /> },
    ],
  },
  {
    label: 'System',
    links: [
      { href: '/dashboard/admin', label: 'Admins', icon: <RiGroupLine size={16} /> },
      { href: '/dashboard/admin/logs', label: 'Audit Logs', icon: <RiFileList3Line size={16} /> },
      { href: '/dashboard/loader', label: 'Loader', icon: <RiLoader4Line size={16} /> },
      { href: '/dashboard/admin/settings', label: 'Settings', icon: <RiSettings3Line size={16} /> },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [bannedCount, setBannedCount] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const sections = user?.role === 'owner' ? ownerSections
    : user?.role === 'admin' ? adminSections
    : customerSections

  const nav = (
    <>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {sections.map((section) => {
          const links = section.links.filter((link) => {
            if (link.conditional && (!bannedCount || bannedCount === 0)) return false
            return true
          })
          if (links.length === 0) return null
          return (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {links.map((link) => {
                  const active = pathname === link.href
                  const isReports = link.href === '/dashboard/admin/screenshots'
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                        active
                          ? 'bg-primary/15 text-primary shadow-[inset_2px_0_0_0_var(--color-crimson-500)]'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <span className={`shrink-0 ${active ? 'text-primary' : 'text-muted-foreground/60'}`}>
                        {link.icon}
                      </span>
                      <span className="flex-1">{link.label}</span>
                      {isReports && pendingCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                          {pendingCount > 99 ? '99+' : pendingCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.username}</p>
            <p className="text-[10px] capitalize text-muted-foreground">{user?.role}</p>
          </div>
        </Link>
        <button
          onClick={() => logout().then(() => window.location.href = '/login')}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <RiLogoutBoxLine size={16} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-3.5 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/80 backdrop-blur md:hidden"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <RiCloseLine size={18} /> : <RiMenuLine size={18} />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <span className="text-xl font-bold text-primary">✦</span>
          <span className="text-lg font-bold tracking-tight text-foreground">ecstacy</span>
        </div>
        {nav}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-60 flex-col border-r border-border bg-sidebar shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
              <span className="text-xl font-bold text-primary">✦</span>
              <span className="text-lg font-bold tracking-tight text-foreground">ecstacy</span>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  )
}
