/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
        source: "/sw.js",
      },
      {
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
        source: "/manifest.webmanifest",
      },
      {
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
        source: "/offline",
      },
    ]
  },
}

export default nextConfig
