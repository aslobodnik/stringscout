import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Plain files on the CDN: prerendered pages served from the ISR store cost
  // read units on every CDN miss, and these pages are several MB each.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
