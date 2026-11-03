import type { NextConfig } from "next";

// The live static site (motion-test on Vercel, folder site/ on main) keeps everything the film
// site has no page for: /app (the control app and the hidden media of scheduled posts in /app/c),
// /studio, /trends, /videos, /inbox, /lib, privacy.html, terms.html, accessibility.html and all the media.
const LEGACY = "https://motion-test-eosin.vercel.app";

const nextConfig: NextConfig = {
  // /app/ and /studio/ keep their slash: the control app's service worker is scoped to /app/
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // checked after every page and public file of the film site
      fallback: [
        { source: "/:path+/", destination: `${LEGACY}/:path+/` },
        { source: "/:path*", destination: `${LEGACY}/:path*` },
      ],
    };
  },
  async headers() {
    return [
      // film media lives in versioned folders: a new render is a new folder
      { source: "/film/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/lab", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
};

export default nextConfig;
