import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA service worker must never be browser-cached (or it sticks around
  // forever and blocks updates); Next would otherwise serve it with a long
  // cache-control like any other static asset. Note: `securityHeaders`
  // below would also be worth adding to the whole app, but is left for the
  // tunnel/HTTPS work since it interacts with the LAN HTTP deploy.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;