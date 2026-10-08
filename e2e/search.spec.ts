import { test, expect } from "@playwright/test";

// The applicants and people search boxes: one list while searching, a line
// under a row that says why it matched when the row itself would not, the
// matched string first in its list, suggestions that name their kind, a
// clear chip, and ?q= landing on the rows it means.

test("applicants: a person's name that lands on one group opens it; closed, the row says why", async ({ page }) => {
  await page.goto("/applicants", { waitUntil: "networkidle" });
  const box = page.getByRole("combobox", { name: /search groups/i });
  await expect(box).toBeVisible();
  await box.fill("paletta");
  // one list, counted once, no paging for one hit
  await expect(page.getByText("1 applicant", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: /applicants pages/ })).toHaveCount(0);
  // the single hit is open down to the entity that names the person, and the
  // name is marked as the match and links to the people page searched for it
  const caret = page.locator("tbody button[aria-expanded]").first();
  await expect(caret).toHaveAttribute("aria-expanded", "true");
  const name = page.getByRole("link", { name: "Catherine Paletta" }).first();
  await expect(name).toBeVisible();
  await expect(name).toHaveAttribute("aria-current", "true");
  await expect(name).toHaveAttribute("href", "/people?q=Catherine%20Paletta");
  // only the matched name is marked
  await expect(page.locator("tbody a[aria-current='true']")).toHaveCount(1);
  // the caret closes it, and the reason line takes over
  await caret.click();
  await expect(caret).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("tr", { hasText: /^names\s/ }).first()).toContainText("Catherine Paletta");
  // several hits open nothing
  await box.fill("king");
  await expect(page.locator("tbody button[aria-expanded='true']")).toHaveCount(0);
  await box.fill("paletta");
  // the chip clears the box and the full paged list comes back
  await page.getByRole("button", { name: /clear the paletta filter/i }).click();
  await expect(box).toHaveValue("");
  await expect(page.getByRole("navigation", { name: /applicants pages/ })).toContainText("1 to 100 of 407");
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

test("people: one hit opens to the entities naming them; the caret closes it; nothing matching says so", async ({ page }) => {
  await page.goto("/people?q=paletta", { waitUntil: "networkidle" });
  await expect(page.locator("tbody tr").first()).toContainText("Catherine Paletta");
  const caret = page.locator("tbody button[aria-expanded]").first();
  await expect(caret).toHaveAttribute("aria-expanded", "true");
  const entity = page.getByRole("link", { name: "Toddler Logic, LLC" });
  await expect(entity).toBeVisible();
  await expect(entity).toHaveAttribute("href", "/applicants?q=Toddler%20Logic%2C%20LLC");
  await caret.click();
  await expect(caret).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("tr", { hasText: /^named by\s/ })).toHaveCount(0);
  await page.getByRole("combobox", { name: /search people/i }).fill("zzqqxx");
  await expect(page.getByText("No one matches.")).toBeVisible();
});

test("people: one list of everyone, a hundred a page, most applications first; a query resets the page", async ({ page }) => {
  await page.goto("/people", { waitUntil: "networkidle" });
  await expect(page.getByText("3307 people", { exact: true })).toBeVisible();
  const pager = page.getByRole("navigation", { name: /people pages/ });
  await expect(pager).toContainText("1 to 100 of 3,307");
  await expect(pager.getByRole("button", { name: "Previous" })).toBeDisabled();
  await expect(page.locator("tbody tr[id^='p-']")).toHaveCount(100);
  const first = await page.locator("tbody tr[id^='p-']").first().locator("td").nth(3).innerText();
  await pager.getByRole("button", { name: "Next" }).click();
  await expect(pager).toContainText("101 to 200 of 3,307");
  await expect(page.locator("tbody tr[id^='p-']")).toHaveCount(100);
  const later = await page.locator("tbody tr[id^='p-']").first().locator("td").nth(3).innerText();
  expect(parseInt(first)).toBeGreaterThanOrEqual(parseInt(later));
  await page.getByRole("combobox", { name: /search people/i }).fill("paletta");
  await expect(pager).toHaveCount(0);
  // clearing the box returns to the page the reader was on
  await page.getByRole("button", { name: /clear the paletta filter/i }).click();
  await expect(pager).toContainText("101 to 200 of 3,307");
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
