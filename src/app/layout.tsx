import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
// fonts served by the site itself (next/font/google fetches at build time,
// and that failed deploys now and then, 31.10). Danielor's pair, as on
// danielor.ai: Karantina for display, Rubik for text.
import "@fontsource-variable/rubik";
import "@fontsource/karantina/hebrew-400.css";
import "@fontsource/karantina/hebrew-700.css";
import "@fontsource/karantina/400.css";
import "@fontsource/karantina/700.css";
import "./globals.css";
import "./kit.css";
import "./danielor.css";
import "./live.css";
import "./og.css";
import FrozenSvh from "@/film/FrozenSvh";
import { site } from "@/site.config";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.name,
  description: site.description,
  robots: site.index ? undefined : { index: false, follow: false },
  openGraph: {
    title: site.name,
    description: site.description,
    locale: "he_IL",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: site.name }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#150a26", colorScheme: "dark light" };

const t = site.theme;
const themeVars = {
  "--c-bg": t.bg,
  "--c-ink": t.ink,
  "--c-soft": t.soft,
  "--c-accent": t.accent,
  "--c-cta": t.cta,
  "--c-cta-ink": t.ctaInk,
} as React.CSSProperties;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" style={themeVars}>
      <body>
        <FrozenSvh />
        {children}
        {/* visits, counted without cookies or personal details (see /privacy) */}
        <Analytics />
      </body>
    </html>
  );
}
