import { Tags } from "aws-cdk-lib";
import type { IConstruct } from "constructs";
import type { LandingEnvironment } from "./environments";

export interface PlatformTags {
	readonly Owner: string;
	readonly ManagedBy: "AWS-CDK";
	readonly Repository: "gobo-cello/landing";
	readonly Workload: "landing";
	readonly Environment: LandingEnvironment;
}

const commonTags = {
	Owner: "gobo-cello",
	ManagedBy: "AWS-CDK",
	Repository: "gobo-cello/landing",
	Workload: "landing",
} as const satisfies Omit<PlatformTags, "Environment">;

export function createPlatformTags(
	environment: LandingEnvironment,
): PlatformTags {
	return {
		...commonTags,
		Environment: environment,
	};
}

export function applyPlatformTags(scope: IConstruct, tags: PlatformTags): void {
	for (const [key, value] of Object.entries(tags)) {
		Tags.of(scope).add(key, value);
	}
}
