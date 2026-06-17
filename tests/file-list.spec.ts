import { test, expect } from '@playwright/test';
import { waitForDecompiledContent, setupTest } from './test-utils';

test.describe('File List Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await setupTest(page);
    });

    test('Navigates to file via search', async ({ page }) => {
        await page.goto('/');
        await page.getByText('ChatFormatting', { exact: true }).click();
        await waitForDecompiledContent(page, 'enum ChatFormatting');

        const searchBox = page.getByRole('searchbox', { name: 'Search classes' });
        await searchBox.fill('LevelRenderer');

        const searchResult = page.getByText('net/minecraft/client/renderer/LevelRenderer', { exact: true });
        await expect(searchResult).toBeVisible();

        await searchResult.click();
        await waitForDecompiledContent(page, 'class LevelRenderer');
    });

    test('Shows multiple search results', async ({ page }) => {
        await page.goto('/');
        await page.getByText('ChatFormatting', { exact: true }).click();
        await waitForDecompiledContent(page, 'enum ChatFormatting');

        const searchBox = page.getByRole('searchbox', { name: 'Search classes' });
        await searchBox.fill('Renderer');

        const searchList = page.locator('.ant-list');
        await expect(searchList).toContainText('LevelRenderer');
    });

    test('Clears search and shows file tree', async ({ page }) => {
        await page.goto('/');
        await page.getByText('ChatFormatting', { exact: true }).click();
        await waitForDecompiledContent(page, 'enum ChatFormatting');

        const searchBox = page.getByRole('searchbox', { name: 'Search classes' });
        await searchBox.fill('LevelRenderer');

        await page.waitForTimeout(500);

        await searchBox.clear();

        const fileTree = page.locator('.ant-tree').first();
        const netFolder = fileTree.getByText('net').first();
        await expect(netFolder).toBeVisible();
    });

    test('Shows classes only by default', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('searchbox', { name: 'Search classes' })).toBeVisible();
        await expect(page.getByText('sample.json', { exact: true })).toHaveCount(0);
    });

    test('Shows and opens text files when all files are enabled', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('setting_show_all_files', 'true');
        });

        await page.goto('/');
        await page.getByText('assets', { exact: true }).click();
        await page.getByText('mcsrc', { exact: true }).click();

        const sampleJson = page.getByText('sample.json', { exact: true });
        await expect(sampleJson).toBeVisible();
        await sampleJson.click();

        const editor = page.getByRole("code").nth(0);
        await expect(editor).toContainText('"name": "dummy-three"');
        await expect(editor).toContainText('"enabled": true');
    });

    test('Shows unsupported files when all files are enabled', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('setting_show_all_files', 'true');
        });

        await page.goto('/');
        await page.getByText('META-INF', { exact: true }).click();
        await page.getByText('MANIFEST.MF', { exact: true }).click();

        await expect(page.getByText('Unsupported file', { exact: true })).toBeVisible();
    });
});
