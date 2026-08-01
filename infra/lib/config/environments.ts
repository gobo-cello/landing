import { type AwsAccountId, parseAwsAccountId } from "./accounts";
import { parseApexDomainName, parseBlogDomainName } from "./dns";

const supportedAwsRegions = ["us-east-1"] as const;

export type AwsRegion = (typeof supportedAwsRegions)[number];

export interface AwsEnvironment {
	readonly account: AwsAccountId;
	readonly region: AwsRegion;
}

const landingEnvironments = ["production"] as const;

export type LandingEnvironment = (typeof landingEnvironments)[number];

export interface LandingConfiguration {
	readonly production: AwsEnvironment;
	readonly apexDomainName: string;
	readonly blogDomainName: string;
}

class MissingEnvironmentVariableError extends Error {
	public constructor(name: string) {
		super(`Required environment variable is missing: ${name}`);
		this.name = "MissingEnvironmentVariableError";
	}
}

function readRequiredEnvironmentVariable(name: string): string {
	const value: string | undefined = process.env[name];

	if (value === undefined || value.length === 0) {
		throw new MissingEnvironmentVariableError(name);
	}

	return value;
}

export function loadLandingConfiguration(): LandingConfiguration {
	// CloudFront用ACM証明書はus-east-1でしか発行できず、landingはCloudFront+ACM
	// 以外のワークロードを持たないため、他リージョンを併用する理由がない。
	const region: AwsRegion = "us-east-1";

	return {
		production: {
			account: parseAwsAccountId(
				readRequiredEnvironmentVariable("AWS_LANDING_PRODUCTION_ACCOUNT_ID"),
			),
			region,
		},
		apexDomainName: parseApexDomainName(
			readRequiredEnvironmentVariable("APEX_DOMAIN_NAME"),
		),
		blogDomainName: parseBlogDomainName(
			readRequiredEnvironmentVariable("BLOG_DOMAIN_NAME"),
		),
	} satisfies LandingConfiguration;
}
