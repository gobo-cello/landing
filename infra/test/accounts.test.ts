import { describe, expect, it, test } from "vitest";
import { parseAwsAccountId } from "../lib/config/accounts";

describe("parseAwsAccountId", () => {
	describe("12桁のAWS account IDが与えられた場合", () => {
		it("そのまま受け入れる", () => {
			expect(parseAwsAccountId("123456789012")).toBe("123456789012");
		});
	});

	describe("不正な値が与えられた場合", () => {
		test.each([undefined, null, "", "123", "12345678901a", 123456789012])(
			"エラーを投げる: %p",
			(value: unknown) => {
				expect(() => parseAwsAccountId(value)).toThrow();
			},
		);
	});
});
