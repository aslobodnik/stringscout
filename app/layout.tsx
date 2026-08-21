import Footer from "@/components/Footer";
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
    "Self-revealed applicants in ICANN's 2026 gTLD round: tracked strings, overlapping strings, key dates. Cited.",
  openGraph: {
    title: "Stringscout",
    description:
      "Self-revealed applicants and applied strings in ICANN's 2026 gTLD round.",
    url: SITE,
    siteName: "Stringscout",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stringscout",
    description: "Self-revealed strings in the 2026 gTLD round.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${oldStandard.variable}`}>
      <body>
        {/* One shell for every page: Footer's mt-auto only pins inside this
            exact flex column, so it cannot live in the pages. */}
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 sm:px-8 pb-20">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
