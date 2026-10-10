'use client'

import { useState } from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { Button } from '@/components/ui/button'
import { RiCalendarLine, RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  min?: Date
}

export function DatePicker({ value, onChange, min }: DatePickerProps) {
  const today = new Date()
  const selectedDate = value ? new Date(value + 'T00:00:00') : null
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? today.getMonth())
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear())

  const firstDay = new Date(viewYear, viewMonth, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }

  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  function pick(day: number) {
    const date = new Date(viewYear, viewMonth, day)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
  }

  function isDisabled(day: number) {
    if (!min) return false
    const date = new Date(viewYear, viewMonth, day)
    date.setHours(0, 0, 0, 0)
    return date < min
  }

  function isToday(day: number) {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
  }

  function isSelected(day: number) {
    if (!selectedDate) return false
    return viewYear === selectedDate.getFullYear() && viewMonth === selectedDate.getMonth() && day === selectedDate.getDate()
  }

  const formatLabel = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Pick date'

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        render={
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 font-normal">
            <RiCalendarLine className="h-4 w-4 text-muted-foreground" />
            <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{formatLabel}</span>
          </Button>
        }
      />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side="bottom" align="start" className="z-50 mt-1">
          <PopoverPrimitive.Popup className="rounded-xl border border-border bg-popover p-3 shadow-md ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
            <div className="flex items-center justify-between px-1 pb-2">
              <button onClick={prev} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <RiArrowLeftSLine className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-foreground">{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={next} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <RiArrowRightSLine className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {DAYS.map((d) => (
                <div key={d} className="flex h-7 w-8 items-center justify-center text-xs text-muted-foreground">{d}</div>
              ))}
              {cells.map((day, i) =>
                day ? (
                  <button
                    key={i}
                    onClick={() => pick(day)}
                    disabled={isDisabled(day)}
                    className={`flex h-7 w-8 items-center justify-center rounded-md text-xs transition-colors
                      ${isSelected(day) ? 'bg-primary text-primary-foreground font-medium' : ''}
                      ${isToday(day) && !isSelected(day) ? 'border border-border font-medium' : ''}
                      ${!isSelected(day) && !isDisabled(day) ? 'text-foreground hover:bg-muted' : ''}
                      ${isDisabled(day) ? 'text-muted-foreground/30 cursor-not-allowed' : ''}
                      ${!isSelected(day) && !isToday(day) && !isDisabled(day) ? 'cursor-pointer' : ''}
                    `}
                  >
                    {day}
                  </button>
                ) : (
                  <div key={i} className="h-7 w-8" />
                )
              )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
