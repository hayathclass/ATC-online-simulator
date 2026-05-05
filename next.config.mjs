/** @type {import('next').NextConfig} */
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude jspdf from SSR to prevent Node.js module loading
  experimental: {
    serverComponentsExternalPackages: ['jspdf'],
  },
  // Use webpack instead of Turbopack for compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' and other node modules on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        worker_threads: false,
      }
      
      // Completely replace jspdf with UMD browser build
      config.resolve.alias = {
        ...config.resolve.alias,
        'jspdf': path.resolve(__dirname, 'node_modules/jspdf/dist/jspdf.umd.min.js'),
        // Also alias fflate to browser version
        'fflate': path.resolve(__dirname, 'node_modules/fflate/umd/index.js'),
      }
    } else {
      // For server-side, also alias to prevent node module issues
      config.resolve.alias = {
        ...config.resolve.alias,
        'jspdf': path.resolve(__dirname, 'node_modules/jspdf/dist/jspdf.umd.min.js'),
      }
    }
    return config
  },
  // Empty turbopack config to silence the warning
  turbopack: {},
}

export default nextConfig
