import { cn } from '@/lib/utils'

// Sizes: 28 | 32 | 36
type AvatarSize = 28 | 32 | 36

interface AvatarProps {
  initials: string
  size?: AvatarSize
  imageUrl?: string
  className?: string
}

export function Avatar({ initials, size = 32, imageUrl, className }: AvatarProps) {
  const fontSize = size <= 28 ? '10px' : size <= 32 ? '12px' : '13px'

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={initials}
        className={cn(className)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div
      className={cn(className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'var(--border-default)',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  )
}
