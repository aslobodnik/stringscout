import { test, expect } from "@playwright/test";

// The page never scrolls sideways. A hover box waiting off the right edge,
// unseen, once gave the page a sideways scroll between 640 and 768px, which
// clipped the tiles and the caption. Every width a phone or a narrow window
// might be, every page that draws the rule or the table.
const WIDTHS = [320, 360, 375, 414, 480, 640, 700, 768, 1024, 1280];
const PAGES = ["/", "/withdrawn", "/sources"];

for (const path of PAGES) {
  for (const width of WIDTHS) {
    test(`${path} does not scroll sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path, { waitUntil: "networkidle" });
      // the press flourishes settle before measuring
      await page.waitForTimeout(1200);
      const { scrollWidth, clientWidth, wide } = await page.evaluate(() => {
        const root = document.documentElement;
        // the offenders, so a failure names them
        const wide = [...document.querySelectorAll("body *")]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.right > root.clientWidth + 1;
          })
          .slice(0, 5)
          .map((e) => `${e.tagName.toLowerCase()} "${(e.textContent ?? "").trim().slice(0, 40)}"`);
        return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, wide };
      });
      expect(scrollWidth, `page is wider than the window; past the edge: ${wide.join("; ")}`).toBe(clientWidth);
    });
  }
}
