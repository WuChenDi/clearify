import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      },
      {
        protocol: 'https',
        hostname: 'notes-wudi.pages.dev'
      }
    ]
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.ts$/, // /\.worker\.(js|mjs)$/
      loader: 'worker-loader',
      options: {
        filename: 'static/[name].[hash].js',
        publicPath: '/_next/'
      }
    })
    return config
  }
}

export default nextConfig
