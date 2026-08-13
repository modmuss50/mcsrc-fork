import { expect, test } from "@playwright/test";
import { setupTest, waitForDecompiledContent } from "./test-utils";

test.describe("Modsrc permalinks", () => {
    test.beforeEach(async ({ page }) => setupTest(page, false));

    test("restores a project, file, class, and line range", async ({ page }) => {
        await page.goto("/1/mock-project/mock-file-1/net/minecraft/ChatFormatting#L10-12");
        await waitForDecompiledContent(page, "enum ChatFormatting");
        await expect(page.locator(".highlighted-line").first()).toBeVisible();
        await expect(page.getByRole("button", { name: /Mock Mod · 1\.0\.1/ })).toBeVisible();
    });

    test("keeps a file-only permalink before a class is selected", async ({ page }) => {
        await page.goto("/1/mock-project/mock-file-1");
        await expect(page).toHaveURL(/\/1\/mock-project\/mock-file-1$/);
        await page.getByText("ChatFormatting", { exact: true }).click();
        await expect(page).toHaveURL(/\/1\/mock-project\/mock-file-1\/net\/minecraft\/ChatFormatting$/);
    });

    test("creates line and line-range fragments", async ({ page }) => {
        await page.goto("/1/mock-project/mock-file-1/net/minecraft/ChatFormatting");
        await waitForDecompiledContent(page, "enum ChatFormatting");
        const lines = page.locator(".monaco-editor .line-numbers");
        await lines.first().click();
        await expect(page).toHaveURL(/#L\d+$/);
        await lines.nth(5).click({ modifiers: ["Shift"] });
        await expect(page).toHaveURL(/#L\d+-\d+$/);
    });
});
