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
  metadataBase: new URL("https://stringscout.com"),
  title: "Stringscout",
  description:
    "Self-revealed applicants in ICANN's 2026 gTLD round: tracked strings, overlapping strings, key dates. Cited.",
  openGraph: {
    title: "Stringscout",
    description:
      "Self-revealed applicants and applied strings in ICANN's 2026 gTLD round.",
    url: "https://stringscout.com",
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
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
