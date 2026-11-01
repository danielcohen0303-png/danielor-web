import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // film media lives in versioned folders: a new render is a new folder
      { source: "/film/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/lab", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
};

export default nextConfig;
