import { describe, expect, it, test } from "vitest";
import { parseApexDomainName } from "../lib/config/dns";

describe("parseApexDomainName", () => {
	describe("空でない文字列が与えられた場合", () => {
		it("そのまま受け入れる", () => {
			expect(parseApexDomainName("example.com")).toBe("example.com");
		});
	});

	describe("空でない文字列以外が与えられた場合", () => {
		test.each([undefined, null, ""])("エラーを投げる: %p", (value: unknown) => {
			expect(() => parseApexDomainName(value)).toThrow();
		});
	});
});
