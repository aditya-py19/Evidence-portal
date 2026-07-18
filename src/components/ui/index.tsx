import { cn } from '../../lib/utils'

import { createPortal } from 'react-dom'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  hover?: boolean
  onClick?: () => void
}

export function GlassCard({ children, className, style, hover = false, onClick }: GlassCardProps) {
  return (
    <div
      className={cn(hover ? 'glass-card-hover' : 'glass-card', 'p-5', className)}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  color?: string
  delay?: number
}

export function StatCard({ label, value, icon, trend, trendUp, color = 'cyan', delay = 0 }: StatCardProps) {
  const colorMap: Record<string, string> = {
    cyan: 'from-sky-50 to-white border-sky-200',
    blue: 'from-blue-50 to-white border-blue-200',
    emerald: 'from-emerald-50 to-white border-emerald-200',
    amber: 'from-amber-50 to-white border-amber-200',
    red: 'from-red-50 to-white border-red-200',
    purple: 'from-violet-50 to-white border-violet-200',
  }

  return (
    <div
      className={cn(
        'glass-card p-5 bg-gradient-to-br border animate-in',
        colorMap[color]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="metric-label">{label}</p>
          <p className="metric-value mt-2">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-2 font-medium', trendUp ? 'text-india-green' : 'text-red-600')}>
              {trend}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-navy-100 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

interface StatusBadgeProps {
  status: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const variants = {
    success: 'bg-green-50 text-india-green border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-navy-100 text-navy-800 border-sky-200',
    default: 'bg-navy-50 text-navy-600 border-navy-200',
  }

  return (
    <span className={cn('status-badge', variants[variant])}>
      {status}
    </span>
  )
}

interface TrustMeterProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function TrustMeter({ score, size = 'md', showLabel = true }: TrustMeterProps) {
  const sizes = { sm: 80, md: 140, lg: 200 }
  const dim = sizes[size]
  const radius = (dim - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = () => {
    if (score >= 95) return '#34d399'
    if (score >= 80) return '#38bdf8'
    if (score >= 60) return '#fbbf24'
    return '#f87171'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="transform -rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="rgba(56,189,248,0.1)"
            strokeWidth="8"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${getColor()}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold text-navy-900', size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg')}>
            {score}
          </span>
          {showLabel && <span className="text-[10px] text-navy-700 uppercase tracking-wider">Trust Score</span>}
        </div>
      </div>
    </div>
  )
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="cyber-input pl-10"
      />
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-cyber-800/50 border border-glass-border mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-navy-900 mb-1">{title}</h3>
      <p className="text-sm text-navy-700 max-w-md">{description}</p>
    </div>
  )
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative max-h-[calc(100vh-2rem)] overflow-y-auto glass-card w-full p-6 animate-in shadow-glow-lg', sizeClasses[size])}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-navy-100 text-navy-700 hover:text-navy-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

interface TabGroupProps {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}

export function TabGroup({ tabs, active, onChange }: TabGroupProps) {
  return (
    <div className="flex gap-1 p-1 bg-navy-50 rounded-lg border border-navy-100">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            active === tab.id
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-navy-700 hover:text-navy-900 hover:bg-white'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
