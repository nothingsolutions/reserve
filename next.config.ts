import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow the RSVP widget to be embedded in an iframe from any origin (Squarespace).
        // Content-Security-Policy frame-ancestors takes precedence over X-Frame-Options
        // in all modern browsers.
        source: '/rsvp-widget',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
          {
            // Override Next.js default SAMEORIGIN so Squarespace can embed the iframe
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ]
  },
}

export default nextConfig
