import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'error' | 'default'

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  success: { background: 'var(--green-light)', color: 'var(--green)' },
  warning: { background: 'var(--amber-light)', color: 'var(--amber)' },
  error: { background: 'var(--red-light)', color: 'var(--red)' },
  default: { background: 'var(--bg-elevated)', color: 'var(--text-muted)' },
}

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  className?: string
}

export function Badge({ label, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '20px',
        letterSpacing: '0.02em',
        ...variantStyles[variant],
      }}
    >
      {label}
    </span>
  )
}
