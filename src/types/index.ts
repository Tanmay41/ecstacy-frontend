export interface User {
  id: string
  email: string
  username: string
  role: 'customer' | 'admin' | 'owner'
  status: 'active' | 'suspended' | 'banned'
  hwid?: string
  lastLogin?: string
  createdAt: string
  suspendedUntil?: string
  suspensionReason?: string
  banReason?: string
  loaderActions?: LoaderAction[]
}

export interface LoaderAction {
  type: 'hwid_mismatch' | 'vm_detect' | 'debug_detect'
  detectedAt: string
  details?: Record<string, unknown>
}

export interface Key {
  id: string
  keyValue: string
  type: 'weekly' | 'monthly' | 'lifetime' | 'custom'
  status: 'active' | 'used' | 'expired' | 'revoked'
  owner?: string | User
  product?: string | Product
  generatedBy?: { id: string; username: string }
  expiresAt?: string
  usedAt?: string
  createdAt: string
  notes?: string
  hwid?: string
  maxHwids?: number
  hwidHistory?: { hwid: string; boundAt: string; unboundAt?: string }[]
}

export interface ProductCheck {
  type: 'process_running'
  value: string
  label: string
  failMessage: string
  hideLoader: boolean
}

export interface Product {
  id: string
  slug: string
  name: string
  type: 'cheat' | 'cleaner' | 'spoofer' | 'tool'
  enabled: boolean
  checks: ProductCheck[]
  createdAt: string
  versionCount?: number
}

export interface ProductVersion {
  id: string
  product: string
  version: string
  status: 'active' | 'beta' | 'deprecated'
  changelog: string
  filePath: string
  fileSize: number
  downloadCount: number
  createdAt: string
}

export interface OwnedProduct {
  slug: string
  name: string
  type: string
}

export interface LogEntry {
  id: string
  actor?: { id: string; email: string; username: string; role: string }
  action: string
  message?: string
  targetId?: string | { _id: string; username?: string; email?: string; keyValue?: string; version?: string }
  targetModel?: string
  details?: Record<string, unknown>
  ip?: string
  userAgent?: string
  createdAt: string
}

export interface Screenshot {
  id: string
  userId: string | { id: string; username: string; email: string; role: string; status: string; hwid?: string }
  imageData: string
  trigger: 'hwid_mismatch' | 'vm_detect' | 'debug_detect' | 'manual' | 'forensic'
  status: 'pending' | 'reviewed' | 'dismissed'
  reviewedBy?: { id: string; username: string }
  reviewedAt?: string
  context?: Record<string, unknown>
  ip?: string
  userAgent?: string
  createdAt: string
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  bannedUsers: number
  totalKeys: number
  activeKeys: number
  usedKeys: number
  expiredKeys: number
  newUsersThisWeek: number
  downloadsThisMonth: number
  keysGeneratedThisMonth: number
  revenueThisMonth: number
  revenueAllTime: number
}

export interface Settings {
  maintenanceMode: boolean
  maxHwidResets: number
  selfHwidResetCooldown: number
  defaultKeyDuration: number
  allowedKeyTypes: string[]
  screenshotTriggers: string[]
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  error?: string
  data?: T
  token?: string
  refreshToken?: string
  user?: User
  users?: User[]
  keys?: Key[]
  key?: Key
  products?: Product[]
  product?: Product
  versions?: ProductVersion[]
  version?: ProductVersion
  logs?: LogEntry[]
  screenshots?: Screenshot[]
  screenshot?: Screenshot
  stats?: AdminStats
  admins?: User[]
  settings?: Settings
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
}

export interface RegisterResponse {
  message: string
  token: string
  refreshToken: string
  user: User
}
