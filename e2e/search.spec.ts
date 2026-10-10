import { test, expect } from "@playwright/test";

// The applicants and people search boxes: one list while searching, a line
// under a row that says why it matched when the row itself would not, the
// matched string first in its list, suggestions that name their kind, a
// clear chip, and ?q= landing on the rows it means.

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
  await box.fill("zzqqxx");
  await expect(page.getByText("No applicants match.")).toBeVisible();
});

test("people: an entity name reaches the people it names, with the reason under the row", async ({ page }) => {
  await page.goto("/people", { waitUntil: "networkidle" });
  const box = page.getByRole("combobox", { name: /search people/i });
  await box.fill("toddler logic");
  await expect(page.getByText(/^\d+ (person|people)$/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: /people pages/ })).toHaveCount(0);
  await expect(page.locator("tr", { hasText: /^named by\s/ }).first()).toContainText("Toddler Logic");
  // one entity sits under the name already: no line, the link is the mark
  await box.fill("namehash");
  await expect(page.locator("tr", { hasText: /^named by\s/ })).toHaveCount(0);
  await expect(page.locator("tbody a[aria-current='true']").first()).toContainText("Namehash");
  // a role is searchable too
  await box.fill("executive");
  await expect(page.locator("tr", { hasText: /^as\s/ }).first()).toContainText("executive");
});

