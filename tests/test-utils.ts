import { expect, Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

export async function waitForDecompiledContent(page: Page, expectedText: string) {
    await expect(page.getByText("Decompiling...")).toBeHidden();
    await expect(page.getByRole("code").first()).toContainText(expectedText);
}

const projects = [{
    project_id: "mock-project",
    id: "mock-project",
    project_type: "mod",
    slug: "mock-mod",
    title: "Mock Mod",
    author: "Test Author",
    description: "A mod used by the browser tests",
    icon_url: null,
    categories: ["fabric"],
    versions: ["mock-version-1", "mock-version-2", "mock-version-3"],
    game_versions: ["1.21.1"],
    loaders: ["fabric"],
}];

const versions = [1, 2, 3].map(number => ({
    id: `mock-version-${number}`,
    project_id: "mock-project",
    name: `Mock Mod ${number}`,
    version_number: `1.0.${number}`,
    version_type: "release",
    date_published: `2026-01-0${number}T00:00:00Z`,
    game_versions: ["1.21.1"],
    loaders: ["fabric"],
    files: [{
        id: `mock-file-${number}`,
        hashes: { sha1: `mock-${number}` },
        url: `http://localhost:4173/test-data/dummy${number}.jar`,
        filename: `mock-mod-${number}.jar`,
        primary: true,
        size: 1000,
        file_type: null,
    }],
}));

export async function setupTest(page: Page, defaultSelection = true) {
    await page.route("http://localhost:4173/", route => defaultSelection
        ? route.fulfill({ status: 302, headers: { Location: "/1/mock-project/mock-file-1" } })
        : route.continue());
    await page.route("https://api.modrinth.com/v2/search**", route => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ hits: projects, offset: 0, limit: 20, total_hits: 1 }),
    }));
    await page.route("https://api.modrinth.com/v2/project/mock-project/version**", route => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(versions),
    }));
    await page.route("https://api.modrinth.com/v2/project/mock-project", route => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(projects[0]),
    }));

    for (let number = 1; number <= 3; number++) {
        await page.route(`http://localhost:4173/test-data/dummy${number}.jar`, route => {
            const jar = fs.readFileSync(path.join(testDirectory, `../java/build/libs/dummy${number}.jar`));
            return route.fulfill({
                status: 200,
                contentType: "application/java-archive",
                headers: { "Content-Length": String(jar.length) },
                body: jar,
            });
        });
    }

    await page.addInitScript(() => {
        localStorage.setItem("setting_auto_jar_index", "true");
    });
}
