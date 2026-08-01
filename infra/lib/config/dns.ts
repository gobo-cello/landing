class InvalidApexDomainNameError extends Error {
	public constructor(value: unknown) {
		super(`Invalid apex domain name: ${String(value)}`);
		this.name = "InvalidApexDomainNameError";
	}
}

export function parseApexDomainName(value: unknown): string {
	if (typeof value !== "string" || value.length === 0) {
		throw new InvalidApexDomainNameError(value);
	}

	return value;
}

class InvalidBlogDomainNameError extends Error {
	public constructor(value: unknown) {
		super(`Invalid blog domain name: ${String(value)}`);
		this.name = "InvalidBlogDomainNameError";
	}
}

export function parseBlogDomainName(value: unknown): string {
	if (typeof value !== "string" || value.length === 0) {
		throw new InvalidBlogDomainNameError(value);
	}

	return value;
}
