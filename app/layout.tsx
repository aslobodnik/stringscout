import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE } from "@/data/meta";
import type { Metadata } from "next";
import { Jost, Old_Standard_TT } from "next/font/google";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const oldStandard = Old_Standard_TT({
  variable: "--font-oldstandard",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  // every page title ends the same way, rather than each repeating the suffix
  title: { default: "Stringscout", template: "%s — Stringscout" },
  alternates: { canonical: "/" },
  description:
    "Every string applied for in ICANN's 2026 gTLD round, who applied, and who stands behind them.",
  openGraph: {
    title: "Stringscout",
    description:
      "Every string applied for in ICANN's 2026 gTLD round, who applied, and who stands behind them.",
    url: SITE,
    siteName: "Stringscout",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stringscout",
    description: "Every string applied for in ICANN's 2026 gTLD round.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${oldStandard.variable}`}>
      <body>
        {/* The plate frame wraps the whole document once and scrolls with it,
            so the shell it sits in has to be the full page, not the column.
            Clipped sideways: a hover box waiting off the right edge, unseen,
            must not give the page a sideways scroll. */}
        <div className="relative min-h-screen overflow-x-clip">
          <div aria-hidden className="paper-plate" />
          {/* One shell for every page: Footer's mt-auto only pins inside this
              exact flex column, so it cannot live in the pages. The top padding
              keeps the wordmark clear of the frame. */}
          <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 sm:px-8 pt-[26px] pb-20">
            {children}
            <Footer />
          </div>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
