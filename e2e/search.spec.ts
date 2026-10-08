import { test, expect } from "@playwright/test";

// The applicants and people search boxes: one list while searching, a line
// under a row that says why it matched when the row itself would not, the
// matched string first in its list, suggestions that name their kind, a
// clear chip, and ?q= landing on the rows it means.

test("applicants: a person's name reaches their group and the row says so", async ({ page }) => {
  await page.goto("/applicants", { waitUntil: "networkidle" });
  const box = page.getByRole("combobox", { name: /search groups/i });
  await expect(box).toBeVisible();
  await box.fill("paletta");
  // one merged list, counted once, no "One application" section while searching
  await expect(page.getByText(/^\d+ applicants?$/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "One application" })).toHaveCount(0);
  const why = page.locator("tr", { hasText: /^names\s/ }).first();
  await expect(why).toContainText("Catherine Paletta");
  // the chip clears the box and the sections come back
  await page.getByRole("button", { name: /clear the paletta filter/i }).click();
  await expect(box).toHaveValue("");
  await expect(page.getByRole("heading", { name: "One application" })).toBeVisible();
});

test("applicants: a string query pins the string to the front and suggestions name their kind", async ({ page }) => {
  await page.goto("/applicants", { waitUntil: "networkidle" });
  const box = page.getByRole("combobox", { name: /search groups/i });
  await box.fill("agen");
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole("option").first()).toContainText(/group|entity|person|string/);
  await listbox.getByRole("option", { name: /^\.agent\s+string$/ }).click();
  await expect(box).toHaveValue(".agent");
  // every visible strings cell starts with the matched string
  const cells = page.locator("tbody tr:not(.sm\\:hidden) td:nth-child(4) a").first();
  await expect(cells).toContainText("agent");
});

test("applicants: nothing matching says so, and ?q= prefills the box", async ({ page }) => {
  await page.goto("/applicants?q=zzqqxx", { waitUntil: "networkidle" });
  await expect(page.getByRole("combobox", { name: /search groups/i })).toHaveValue("zzqqxx");
  await expect(page.getByText("No applicants match.")).toBeVisible();
});

test("people: an entity name reaches the people it names, with the reason under the row", async ({ page }) => {
  await page.goto("/people", { waitUntil: "networkidle" });
  const box = page.getByRole("combobox", { name: /search people/i });
  await box.fill("toddler logic");
  await expect(page.getByText(/^\d+ (person|people)$/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "One application" })).toHaveCount(0);
  await expect(page.locator("tr", { hasText: /^named by\s/ }).first()).toContainText("Toddler Logic");
  // a role is searchable too
  await box.fill("executive");
  await expect(page.locator("tr", { hasText: /^as\s/ }).first()).toContainText("executive");
});

test("people: the person's own name needs no reason line and nothing matching says so", async ({ page }) => {
  await page.goto("/people?q=paletta", { waitUntil: "networkidle" });
  await expect(page.locator("tbody tr").first()).toContainText("Catherine Paletta");
  await expect(page.locator("tr", { hasText: /^named by\s/ })).toHaveCount(0);
  await page.getByRole("combobox", { name: /search people/i }).fill("zzqqxx");
  await expect(page.getByText("No one matches.")).toBeVisible();
});

for (const path of ["/applicants?q=paletta", "/people?q=toddler"]) {
  test(`${path} does not scroll sideways at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
}
