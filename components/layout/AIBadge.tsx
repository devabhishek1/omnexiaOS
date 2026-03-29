import { cn } from '@/lib/utils'

interface AIBadgeProps {
  className?: string
}

export function AIBadge({ className }: AIBadgeProps) {
  return (
    <span
      className={cn(className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--ai-light)',
        color: 'var(--ai)',
        fontSize: '10px',
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: '20px',
        letterSpacing: '0.05em',
        border: '1px solid var(--ai-border)',
      }}
    >
      ✦ AI
    </span>
  )
}
