import { cn } from '@/lib/utils'

type Channel = 'gmail' | 'instagram' | 'facebook'

const channelStyles: Record<Channel, React.CSSProperties> = {
  gmail: { background: 'var(--gmail-light)', color: 'var(--gmail)' },
  instagram: { background: 'var(--instagram-light)', color: 'var(--instagram)' },
  facebook: { background: 'var(--facebook-light)', color: 'var(--facebook)' },
}

const channelLabels: Record<Channel, string> = {
  gmail: 'Gmail',
  instagram: 'Instagram',
  facebook: 'Facebook',
}

interface ChannelBadgeProps {
  channel: Channel
  className?: string
}

export function ChannelBadge({ channel, className }: ChannelBadgeProps) {
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
        ...channelStyles[channel],
      }}
    >
      {channelLabels[channel]}
    </span>
  )
}
