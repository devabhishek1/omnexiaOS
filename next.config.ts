import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./next-intl.config.ts')

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'sonner'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

export default withNextIntl(nextConfig)
