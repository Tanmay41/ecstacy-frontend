'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { User } from '@/types'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  user: User | null
  confirmText?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
  loading?: boolean
  children?: React.ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  user,
  confirmText = 'Confirm',
  variant = 'destructive',
  onConfirm,
  loading,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {user && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{user.username}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Role:</span>{' '}
                <span className="capitalize text-foreground">{user.role}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className="capitalize text-foreground">{user.status}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">ID:</span>{' '}
                <span className="font-mono text-foreground">{user.id}</span>
              </div>
            </div>
          </div>
        )}
        {children && <div className="space-y-3">{children}</div>}
        <DialogFooter showCloseButton>
          {variant === 'destructive' ? (
            <Button variant="destructive" onClick={onConfirm} disabled={loading}>
              {loading ? 'Processing...' : confirmText}
            </Button>
          ) : (
            <Button onClick={onConfirm} disabled={loading}>
              {loading ? 'Processing...' : confirmText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
