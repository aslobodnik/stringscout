import { test, expect } from "@playwright/test";
import type { ExploreResponse } from "../lib/explore";

function response(query: string): ExploreResponse {
  return {
    query,
    results: Array.from({ length: 75 }, (_, index) => ({
      tld: index === 0 ? "mountain" : `string${index}`,
      score: 0.99 - index / 100,
      ...(index === 1 ? { gloss: "a translated meaning" } : {}),
    })),
    metrics: { serverMs: 400, evaluated: 783 },
  };
}

test("Enter shows 10 results, caps at 25, and keeps diagnostics out of the page", async ({ page }) => {
  const queries: string[] = [];
  await page.route("**/api/explore", async (route) => {
    const { query, limit } = route.request().postDataJSON();
    expect(limit).toBe(25);
    queries.push(query);
    await route.fulfill({ json: response(query) });
  });
  await page.goto("/explore");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Explore Related Strings");
  const input = page.getByRole("textbox", { name: "Word or phrase" });
  await input.fill("ski");
  await page.waitForTimeout(400);
  expect(queries).toEqual([]);
  await input.press("Enter");
  const pills = page.getByRole("list", { name: "Related strings" }).getByRole("button");
  await expect(pills).toHaveCount(10);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page.getByRole("button", { name: "Show 25 strings", exact: true }).click();
  await expect(pills).toHaveCount(25);
  await expect(page.getByRole("button", { name: "Show 25 strings", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Show details", exact: true })).toHaveCount(0);
  await expect(page.getByRole("main")).not.toContainText(/score|latency|server search|round trip|gold rule|model|provider|\d+ ms/i);
  expect(queries).toEqual(["ski"]);
  await pills.first().click();
  await expect(input).toHaveValue("mountain");
  await expect(page.getByRole("status")).toContainText("results for “mountain”");
  expect(queries).toEqual(["ski", "mountain"]);
});

test("errors can be retried and a newer query wins over an older response", async ({ page }) => {
  await page.route("**/api/explore", async (route) => {
    const { query } = route.request().postDataJSON();
    if (query === "fail") return route.fulfill({ status: 502, json: { error: "Search didn’t finish. Please try again." } });
    if (query === "slow") await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({ json: response(query) });
  });
  await page.goto("/explore");
  const input = page.getByRole("textbox", { name: "Word or phrase" });
  await input.fill("fail");
  await input.press("Enter");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Please try again");
  await input.fill("slow");
  await input.press("Enter");
  await expect(page.getByRole("status")).toContainText("Finding connections");
  await input.fill("new query");
  await input.press("Enter");
  await expect(page.getByRole("status")).toContainText("results for “new query”");
  await page.waitForTimeout(750);
  await expect(page.getByRole("status")).toContainText("results for “new query”");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});

test("single-line input ignores Shift+Enter and composition submission", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/explore", async (route) => { calls++; await route.fulfill({ json: response("test") }); });
  await page.goto("/explore");
  const input = page.getByRole("textbox", { name: "Word or phrase" });
  await input.fill("snow");
  await input.press("Shift+Enter");
  await expect(input).toHaveValue("snow");
  await input.dispatchEvent("keydown", { key: "Enter", isComposing: true });
  expect(calls).toBe(0);
});

for (const width of [375, 1280]) {
  test(`25 results fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/explore", (route) => route.fulfill({ json: response("a sentence about a quiet mountain after fresh snow") }));
    await page.goto("/explore");
    await page.getByRole("textbox", { name: "Word or phrase" }).fill("a sentence about a quiet mountain after fresh snow");
    await page.getByRole("button", { name: "Explore", exact: false }).click();
    await page.getByRole("button", { name: "Show 25 strings", exact: true }).click();
    await expect(page.getByRole("list", { name: "Related strings" }).getByRole("button")).toHaveCount(25);
    const overflow = await page.evaluate(() => [...document.querySelectorAll("main *, nav")].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && (rect.left < 0 || rect.right > innerWidth);
    }).map((element) => element.tagName));
    expect(overflow).toEqual([]);
  });
}
