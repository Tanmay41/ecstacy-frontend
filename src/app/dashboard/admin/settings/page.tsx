'use client'

import { useEffect, useState, type FormEvent } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  RiLoaderLine, RiComputerLine, RiKeyLine, RiShieldFlashLine,
  RiCheckLine, RiCloseLine, RiSaveLine, RiCameraLine
} from '@remixicon/react'

interface Settings {
  maintenanceMode: boolean
  maxHwidResets: number
  selfHwidResetCooldown: number
  defaultKeyDuration: number
  allowedKeyTypes: string[]
  screenshotTriggers: string[]
}

const KEY_TYPES = ['weekly', 'monthly', 'lifetime', 'custom'] as const
const SCREENSHOT_TRIGGERS = [
  { value: 'login_failed', label: 'Login Failed' },
  { value: 'hwid_mismatch', label: 'HWID Mismatch' },
  { value: 'vm_detect', label: 'VM Detect' },
  { value: 'debug_detect', label: 'Debug Detect' },
  { value: 'menu.launch_rejected', label: 'Menu — Launch Rejected' },
  { value: 'menu.heartbeat_ban', label: 'Menu — Heartbeat Ban' },
  { value: 'menu.heartbeat_unreachable', label: 'Menu — Heartbeat Unreachable' },
  { value: 'menu.anti_debug', label: 'Menu — Anti Debug' },
  { value: 'menu.anti_tamper', label: 'Menu — Anti Tamper' },
  { value: 'menu.anti_window', label: 'Menu — Anti Window' },
  { value: 'menu.anti_process', label: 'Menu — Anti Process' },
] as const

const INITIAL: Settings = {
  maintenanceMode: false,
  maxHwidResets: 2,
  selfHwidResetCooldown: 24,
  defaultKeyDuration: 30,
  allowedKeyTypes: ['weekly', 'monthly', 'lifetime', 'custom'],
  screenshotTriggers: [
    'hwid_mismatch', 'vm_detect', 'debug_detect', 'login_failed',
    'menu.launch_rejected', 'menu.heartbeat_ban', 'menu.heartbeat_unreachable',
    'menu.anti_debug', 'menu.anti_tamper', 'menu.anti_window', 'menu.anti_process',
  ],
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        checked ? 'bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'bg-muted shadow-inner'
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-1 ring-foreground/10 transition-all duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`} />
    </button>
  )
}

function SettingCard({
  icon: Icon,
  title,
  description,
  accent = 'border-l-primary',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  accent?: string
  children: React.ReactNode
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-2xl ring-1 ring-foreground/5 transition-shadow hover:shadow-md hover:shadow-foreground/5 ${accent} border-l-2`}>
      <div className="relative flex items-start gap-4 border-b border-border/50 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="px-5 py-4">
        {children}
      </div>
    </div>
  )
}

function PillCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-all duration-150 ${
        checked
          ? 'border-primary/40 bg-primary/10 shadow-[0_0_12px_rgba(168,85,247,0.08)]'
          : 'border-border bg-muted/30 text-muted-foreground hover:border-foreground/20'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-primary accent-primary"
      />
      <span className={`capitalize ${checked ? 'text-foreground' : ''}`}>{label}</span>
    </label>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    api.get('/admin/settings').then((r) => {
      setSettings({ ...INITIAL, ...r.data.settings })
    }).catch(() => {
      setMsg({ type: 'error', text: 'Failed to load settings' })
      setSettings(INITIAL)
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    setMsg(null)
    try {
      await api.patch('/admin/settings', settings)
      setMsg({ type: 'success', text: 'All settings saved successfully' })
      setDirty(false)
    } catch {
      setMsg({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev)
    setDirty(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RiLoaderLine className="h-5 w-5 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <RiCloseLine className="h-8 w-8" />
        <p>Failed to load settings</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage global system configuration</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <SettingCard
          icon={RiComputerLine}
          title="HWID"
          description="Control HWID reset limits and cooldowns"
          accent="border-l-emerald-500"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Max HWID Resets</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={settings.maxHwidResets}
                onChange={(e) => update('maxHwidResets', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reset Cooldown (hours)</Label>
              <Input
                type="number"
                min={0}
                max={168}
                value={settings.selfHwidResetCooldown}
                onChange={(e) => update('selfHwidResetCooldown', Number(e.target.value))}
              />
            </div>
          </div>
        </SettingCard>

        <SettingCard
          icon={RiKeyLine}
          title="Keys"
          description="Default key duration and allowed key types"
          accent="border-l-amber-500"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Default Key Duration (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={settings.defaultKeyDuration}
                onChange={(e) => update('defaultKeyDuration', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Allowed Key Types</Label>
              <div className="flex flex-wrap gap-2">
                {KEY_TYPES.map((type) => (
                  <PillCheckbox
                    key={type}
                    label={type}
                    checked={settings.allowedKeyTypes.includes(type)}
                    onChange={(checked) => {
                      const next = checked
                        ? [...settings.allowedKeyTypes, type]
                        : settings.allowedKeyTypes.filter((t) => t !== type)
                      update('allowedKeyTypes', next)
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </SettingCard>

        <SettingCard
          icon={RiCameraLine}
          title="Reports"
          description="Choose which events include a visual report in the loader and menu"
          accent="border-l-violet-500"
        >
          <div className="space-y-1.5">
            <Label>Auto-Capture Triggers</Label>
            <div className="flex flex-wrap gap-2">
              {SCREENSHOT_TRIGGERS.map((t) => (
                <PillCheckbox
                  key={t.value}
                  label={t.label}
                  checked={settings.screenshotTriggers.includes(t.value)}
                  onChange={(checked) => {
                    const next = checked
                      ? [...settings.screenshotTriggers, t.value]
                      : settings.screenshotTriggers.filter((s) => s !== t.value)
                    update('screenshotTriggers', next)
                  }}
                />
              ))}
            </div>
          </div>
        </SettingCard>

        <SettingCard
          icon={RiShieldFlashLine}
          title="Maintenance"
          description="Toggle maintenance mode to block non-admin access"
          accent="border-l-red-500"
        >
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                settings.maintenanceMode ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
              }`}>
                <RiShieldFlashLine className="h-3 w-3" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                <p className={`text-xs ${settings.maintenanceMode ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {settings.maintenanceMode ? 'Active — only admins can access' : 'Inactive — all access allowed'}
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.maintenanceMode}
              onChange={() => update('maintenanceMode', !settings.maintenanceMode)}
            />
          </div>
        </SettingCard>

        {msg && (
          <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm backdrop-blur-2xl ${
            msg.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}>
            {msg.type === 'success' ? (
              <RiCheckLine className="h-4 w-4 shrink-0" />
            ) : (
              <RiCloseLine className="h-4 w-4 shrink-0" />
            )}
            {msg.text}
          </div>
        )}

        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-5 py-4 backdrop-blur-2xl">
          <div className="flex-1 text-xs text-muted-foreground">
            {dirty ? 'You have unsaved changes' : 'All settings are up to date'}
          </div>
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? (
              <span className="flex items-center gap-2">
                <RiLoaderLine className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RiSaveLine className="h-4 w-4" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
