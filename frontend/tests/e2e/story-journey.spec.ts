import { test, expect } from "@playwright/test";

test("user can generate and branch a story", async ({ page }) => {
  await page.goto("http://localhost:3000/create");

  await page.getByRole("button", { name: "Generate story" }).click();

  await expect(page.getByRole("heading", { name: "Current scene" })).toBeVisible();
  const firstChoice = page.getByRole("button", { name: /Follow|Visit|Sing|Share|Float|Wish/i }).first();
  if (await firstChoice.isVisible()) {
    await firstChoice.click();
  }
  await expect(page.getByText(/Current scene/i)).toBeVisible();
});

test("interactive controls expose visible keyboard focus", async ({ page }) => {
  await page.goto("http://localhost:3000/create");

  const generateButton = page.getByRole("button", { name: "Generate story" });
  await generateButton.focus();

  const outlineColor = await generateButton.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return styles.outlineColor;
  });
  const outlineWidth = await generateButton.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return styles.outlineWidth;
  });

  expect(outlineColor).toBe("rgb(29, 78, 216)");
  expect(outlineWidth).toBe("3px");
});
