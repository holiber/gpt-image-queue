/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/gpt-image-queue' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/gpt-image-queue' : ''
}

module.exports = nextConfig
