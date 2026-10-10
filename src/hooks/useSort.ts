'use client'

import { useState, useMemo } from 'react'

export type SortDir = 'asc' | 'desc'

export function useSort<T>(data: T[], defaultKey?: string, sortOrders?: Record<string, string[]>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultKey || null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggle(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function getValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((acc: unknown, key: string) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
      return undefined
    }, obj)
  }

  function compare(a: T, b: T): number {
    const rawA = getValue(a, sortKey!)
    const rawB = getValue(b, sortKey!)

    if (sortOrders?.[sortKey!]) {
      const order = sortOrders[sortKey!]
      const iA = rawA != null ? order.indexOf(String(rawA)) : -1
      const iB = rawB != null ? order.indexOf(String(rawB)) : -1
      const diff = (iA === -1 ? Infinity : iA) - (iB === -1 ? Infinity : iB)
      return sortDir === 'asc' ? diff : -diff
    }

    let aVal = rawA
    let bVal = rawB
    if (aVal == null) aVal = ''
    if (bVal == null) bVal = ''
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDir === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime()
    }
    const aStr = String(aVal)
    const bStr = String(bVal)
    return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort(compare)
  }, [data, sortKey, sortDir, sortOrders])

  return { sorted, sortKey, sortDir, toggle }
}
