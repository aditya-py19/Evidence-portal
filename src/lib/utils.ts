import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TrustLevel } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTrustLevel(score: number): TrustLevel {
  if (score >= 95) return 'highly_trusted'
  if (score >= 80) return 'trusted'
  if (score >= 60) return 'needs_review'
  return 'high_risk'
}

export function getTrustLevelLabel(level: TrustLevel): string {
  const labels: Record<TrustLevel, string> = {
    highly_trusted: 'Highly Trusted',
    trusted: 'Trusted',
    needs_review: 'Needs Review',
    high_risk: 'High Risk',
  }
  return labels[level]
}

export function getTrustLevelColor(level: TrustLevel): string {
  const colors: Record<TrustLevel, string> = {
    highly_trusted: 'text-emerald-700',
    trusted: 'text-navy-800',
    needs_review: 'text-amber-700',
    high_risk: 'text-red-700',
  }
  return colors[level]
}

export function getTrustLevelBg(level: TrustLevel): string {
  const colors: Record<TrustLevel, string> = {
    highly_trusted: 'bg-emerald-50 border-emerald-200',
    trusted: 'bg-sky-50 border-sky-200',
    needs_review: 'bg-amber-50 border-amber-200',
    high_risk: 'bg-red-50 border-red-200',
  }
  return colors[level]
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function generateStars(score: number): number {
  if (score >= 95) return 5
  if (score >= 80) return 4
  if (score >= 60) return 3
  if (score >= 40) return 2
  return 1
}

export function truncateHash(hash: string, len = 12): string {
  if (hash.length <= len * 2) return hash
  return `${hash.slice(0, len)}...${hash.slice(-len)}`
}
