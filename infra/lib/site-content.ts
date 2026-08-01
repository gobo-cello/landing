import {
	cpSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * site/はビルドを持たない素の静的HTML/CSSであり、コード外の設定を注入する
 * テンプレートエンジンを持たない。ドメイン名などコード非依存であるべき値を
 * コミット済みのHTMLへ直接書くとドメイン非依存の原則に反するため、
 * `{{KEY}}`形式のプレースホルダーだけをHTMLに残し、deploy時にこの関数で
 * 実際の値へ置換したコピーを一時ディレクトリへ書き出す。
 */
export function renderSiteContent(
	sourceDir: string,
	substitutions: Readonly<Record<string, string>>,
): string {
	const outputDir = mkdtempSync(join(tmpdir(), "landing-site-"));
	cpSync(sourceDir, outputDir, { recursive: true });

	for (const entry of readdirSync(outputDir)) {
		const entryPath = join(outputDir, entry);

		if (!entry.endsWith(".html") || !statSync(entryPath).isFile()) {
			continue;
		}

		const rendered = Object.entries(substitutions).reduce(
			(content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
			readFileSync(entryPath, "utf-8"),
		);

		writeFileSync(entryPath, rendered);
	}

	return outputDir;
}
