import { expect, test } from "@playwright/test";
import { setupTest, waitForDecompiledContent } from "./test-utils";

test.describe("Modrinth selection", () => {
    test.beforeEach(async ({ page }) => setupTest(page, false));

    test("searches for a mod, selects its primary file, and decompiles it", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("textbox", { name: "Search Modrinth mods" }).fill("mock");
        await page.getByText("Mock Mod", { exact: true }).click();
        await page.getByText("Mock Mod 1", { exact: true }).click();
        await expect(page).toHaveURL(/\/1\/mock-project\/mock-file-1$/);
        await page.getByText("ChatFormatting", { exact: true }).click();
        await waitForDecompiledContent(page, "enum ChatFormatting");
    });

    test("changes releases and clears the previous class selection", async ({ page }) => {
        await page.goto("/1/mock-project/mock-file-1/net/minecraft/ChatFormatting");
        await waitForDecompiledContent(page, "enum ChatFormatting");
        await page.getByRole("button", { name: /Mock Mod · 1\.0\.1/ }).click();
        await page.getByRole("textbox", { name: "Search Modrinth mods" }).fill("mock");
        await page.getByText("Mock Mod", { exact: true }).click();
        await page.getByText("Mock Mod 2", { exact: true }).click();
        await expect(page).toHaveURL(/\/1\/mock-project\/mock-file-2$/);
        await expect(page.getByText("Select a class from the tree")).toBeVisible();
    });
});
