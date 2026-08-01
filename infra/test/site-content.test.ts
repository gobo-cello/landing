import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderSiteContent } from "../lib/site-content";

describe("renderSiteContent", () => {
	const fixtureDir = join(__dirname, "fixtures", "site-content");

	it("HTMLファイル内の{{KEY}}プレースホルダーを指定した値へ置換する", () => {
		const outputDir = renderSiteContent(fixtureDir, {
			BLOG_DOMAIN_NAME: "blog.example.com",
		});

		const rendered = readFileSync(join(outputDir, "index.html"), "utf-8");

		expect(rendered).toContain('href="https://blog.example.com"');
		expect(rendered).not.toContain("{{BLOG_DOMAIN_NAME}}");
	});

	it("置換対象を持たないファイルはそのまま出力する", () => {
		const original = readFileSync(join(fixtureDir, "404.html"), "utf-8");

		const outputDir = renderSiteContent(fixtureDir, {
			BLOG_DOMAIN_NAME: "blog.example.com",
		});

		expect(readFileSync(join(outputDir, "404.html"), "utf-8")).toBe(original);
	});
});
