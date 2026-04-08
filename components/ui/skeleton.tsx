import { cn } from "@/lib/utils"

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #F0F0EE 25%, #E8E8E5 50%, #F0F0EE 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
}

function Skeleton({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md", className)}
      style={{ ...shimmerStyle, ...style }}
      {...props}
    />
  )
}

export { Skeleton }
