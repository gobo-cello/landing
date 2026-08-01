import type { LandingEnvironment } from "./environments";

const githubRepositoryOwner = "gobo-cello" as const;

const githubRepositoryName = "landing" as const;

export const githubActionsOidcProviderUrl =
	"https://token.actions.githubusercontent.com" as const;

export const githubActionsOidcAudience = "sts.amazonaws.com" as const;

/**
 * GitHubはowner/repository名の後ろに`@<numeric ID>`(例: `gobo-cello@171334196`)を
 * 付与したsub claimを発行する(immutable subject claim)。`@`以降のID部分だけを
 * StringLikeのワイルドカードで吸収し、owner名・repository名は完全一致にする。
 * 参考: https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
 */
export function createGithubActionsSubClaim(
	environment: LandingEnvironment,
): string {
	return `repo:${githubRepositoryOwner}@*/${githubRepositoryName}@*:environment:${environment}`;
}
