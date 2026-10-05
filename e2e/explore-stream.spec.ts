import { test, expect, type Page } from "@playwright/test";

async function mockStream(page: Page) {
  await page.route("**/api/catalog", route => route.fulfill({ status: 503 }));
  await page.addInitScript(() => {
    const original = window.fetch;
    const requests: { query: string; scope: string; stream: boolean }[] = [];
    const streams = new Map<string, ReadableStreamDefaultController<Uint8Array>>();
    const newly = Array.from({ length: 25 }, (_, i) => ({ tld: `new${i}`, score: 0.9 - i / 100 }));
    const existing = Array.from({ length: 25 }, (_, i) => ({ tld: `existing${i}`, score: 0.8 - i / 100, existing: true }));
    const line = (value: unknown) => new TextEncoder().encode(`${JSON.stringify(value)}\n`);
    const packet = (query: string, scope: string, complete: boolean) => ({
      query, complete, results: complete ? [...newly, ...existing].slice(0, 25) : scope === "existing" ? existing : newly,
      resultSets: complete ? { new: newly, existing } : { [scope]: scope === "existing" ? existing : newly },
      metrics: { serverMs: 10, evaluated: complete ? 1383 : 779 },
    });
    Object.assign(window, {
      exploreTest: { requests,
        finish(query: string, failed = false) {
          const controller = streams.get(query)!;
          controller.enqueue(line(failed ? { error: "Failed", failedScope: "existing" } : packet(query, "new", true)));
          controller.close();
        },
      },
    });
    window.fetch = async (input, init) => {
      if (!String(input).endsWith("/api/explore") || init?.method !== "POST") return original(input, init);
      const request = JSON.parse(String(init.body));
      requests.push(request);
      return new Response(new ReadableStream({ start(controller) {
        streams.set(request.query, controller);
        controller.enqueue(line(packet(request.query, request.scope, false)));
      } }), { headers: { "Content-Type": "application/x-ndjson" } });
    };
  });
}

// Explicit controls keep the second group pending until the UI assertions finish.
const finish = (page: Page, query: string, failed = false) => page.evaluate(({ query, failed }) => {
  (window as unknown as { exploreTest: { finish(query: string, failed: boolean): void } }).exploreTest.finish(query, failed);
}, { query, failed });
const requests = (page: Page) => page.evaluate(() => (window as unknown as { exploreTest: { requests: unknown[] } }).exploreTest.requests);

test("first group is usable before completion; switching preserves expansion and makes no request", async ({ page }) => {
  await mockStream(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/explore");
  const input = page.getByRole("textbox", { name: "Word or phrase" });
  await input.fill("snow");
  await input.press("Enter");
  const pills = page.getByRole("list", { name: "Related strings" }).getByRole("button");
  await expect(pills).toHaveCount(10);
  await expect(pills.first()).toHaveText(".new0");
  await expect(page.getByRole("status")).not.toContainText("Finding connections");
  await page.getByRole("button", { name: "Show 15 more" }).click();
  await page.getByRole("radiogroup", { name: "String types" }).getByText("Existing", { exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Finding connections");
  await expect(page.getByText("No strings to explore yet.")).toHaveCount(0);
  await finish(page, "snow");
  await expect(pills).toHaveCount(25);
  await expect(pills.first()).toContainText(".existing0");
  await expect(page.getByRole("button", { name: "Show fewer" })).toBeVisible();
  await page.getByRole("radiogroup", { name: "String types" }).getByText("Both", { exact: true }).click();
  await page.getByRole("radiogroup", { name: "String types" }).getByText("New", { exact: true }).click();
  await expect(pills).toHaveCount(25);
  expect(await requests(page)).toEqual([{ query: "snow", limit: 25, scope: "new", stream: true }]);
});

test("hidden failure keeps the first results and lets the missing group be retried", async ({ page }) => {
  await mockStream(page);
  await page.goto("/explore");
  const input = page.getByRole("textbox", { name: "Word or phrase" });
  await input.fill("snow");
  await input.press("Enter");
  const pills = page.getByRole("list", { name: "Related strings" }).getByRole("button");
  await expect(pills).toHaveCount(10);
  await finish(page, "snow", true);
  await expect(pills).toHaveCount(10);
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await page.getByRole("radiogroup", { name: "String types" }).getByText("Existing", { exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("The remaining results didn’t load.");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(pills.first()).toContainText(".existing0");
  expect(await requests(page)).toHaveLength(2);
  await finish(page, "snow");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});

test("late completion from an old query cannot replace a new query", async ({ page }) => {
  await mockStream(page);
  await page.goto("/explore");
  const input = page.getByRole("textbox", { name: "Word or phrase" });
  await input.fill("snow");
  await input.press("Enter");
  await expect(page.getByRole("region", { name: "Results for snow", exact: true })).toBeVisible();
  await input.fill("ocean");
  await input.press("Enter");
  await expect(page.getByRole("region", { name: "Results for ocean", exact: true })).toBeVisible();
  await finish(page, "snow");
  await finish(page, "ocean");
  await expect(page.getByRole("region", { name: "Results for ocean", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Results for snow", exact: true })).toHaveCount(0);
});
