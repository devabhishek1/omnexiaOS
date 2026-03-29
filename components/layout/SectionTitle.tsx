import { cn } from '@/lib/utils'

interface SectionTitleProps {
  children: React.ReactNode
  className?: string
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <p
      className={cn(className)}
      style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '16px',
        margin: '0 0 16px 0',
      }}
    >
      {children}
    </p>
  )
}
