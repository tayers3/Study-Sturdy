import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const stableDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})

const stableMonthFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
})

const stableNumberFormatter = new Intl.NumberFormat('en-US')

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatStableDate(date);
}

export function formatStableDate(date: Date): string {
  return stableDateFormatter.format(date)
}

export function formatStableMonth(date: Date): string {
  return stableMonthFormatter.format(date)
}

export function formatStableNumber(value: number | string): string {
  const numericValue = typeof value === 'number' ? value : Number(value)

  if (Number.isFinite(numericValue)) {
    return stableNumberFormatter.format(numericValue)
  }

  return String(value)
}
