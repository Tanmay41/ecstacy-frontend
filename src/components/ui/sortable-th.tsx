'use client'

import { cn } from '@/lib/utils'
import type { SortDir } from '@/hooks/useSort'
import { RiArrowUpSLine, RiArrowDownSLine } from '@remixicon/react'

interface SortableThProps extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'onToggle'> {
  sortKey: string
  currentKey: string | null
  direction: SortDir
  onToggle: (key: string) => void
}

export function SortableTh({ sortKey, currentKey, direction, onToggle, className, children, ...props }: SortableThProps) {
  const active = currentKey === sortKey
  return (
    <th
      className={cn('cursor-pointer select-none px-4 py-3 text-left text-muted-foreground transition-colors hover:text-foreground', className)}
      onClick={() => onToggle(sortKey)}
      {...props}
    >
      <div className="inline-flex items-center gap-1">
        {children}
        <span className="flex flex-col leading-none">
          <RiArrowUpSLine className={cn('h-3 w-3 -mb-0.5', active && direction === 'asc' ? 'text-foreground' : 'text-muted-foreground/40')} />
          <RiArrowDownSLine className={cn('h-3 w-3 -mt-0.5', active && direction === 'desc' ? 'text-foreground' : 'text-muted-foreground/40')} />
        </span>
      </div>
    </th>
  )
}
