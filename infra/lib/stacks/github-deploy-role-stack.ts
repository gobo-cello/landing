import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import {
	Effect,
	OidcProviderNative,
	OpenIdConnectPrincipal,
	PolicyStatement,
	Role,
} from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";
import {
	createCdkDeployRoleArn,
	createCdkFilePublishingRoleArn,
	createCdkLookupRoleArn,
} from "../config/cdk-bootstrap";
import type {
	AwsEnvironment,
	LandingEnvironment,
} from "../config/environments";
import {
	createGithubActionsSubClaim,
	githubActionsOidcAudience,
	githubActionsOidcProviderUrl,
} from "../config/github";
import { applyPlatformTags, createPlatformTags } from "../config/tags";

export interface GithubDeployRoleStackProps extends StackProps {
	readonly deploymentEnvironment: LandingEnvironment;
	readonly awsEnvironment: AwsEnvironment;
}

export class GithubDeployRoleStack extends Stack {
	public constructor(
		scope: Construct,
		id: string,
		props: GithubDeployRoleStackProps,
	) {
		super(scope, id, {
			...props,
			terminationProtection: true,
		});

		const provider = new OidcProviderNative(this, "GithubActionsOidcProvider", {
			url: githubActionsOidcProviderUrl,
			clientIds: [githubActionsOidcAudience],
		});

		const deployRole = new Role(this, "GithubDeployRole", {
			assumedBy: new OpenIdConnectPrincipal(provider, {
				StringEquals: {
					"token.actions.githubusercontent.com:aud": githubActionsOidcAudience,
				},
				StringLike: {
					"token.actions.githubusercontent.com:sub":
						createGithubActionsSubClaim(props.deploymentEnvironment),
				},
			}),
			description:
				`Role assumed by GitHub Actions to CDK deploy the ${props.deploymentEnvironment} environment. ` +
				"Only allows assuming the CDK bootstrap deploy-role, file-publishing-role, and lookup-role.",
		});

		deployRole.addToPolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["sts:AssumeRole"],
				resources: [
					createCdkDeployRoleArn(
						props.awsEnvironment.account,
						props.awsEnvironment.region,
					),
					createCdkFilePublishingRoleArn(
						props.awsEnvironment.account,
						props.awsEnvironment.region,
					),
					createCdkLookupRoleArn(
						props.awsEnvironment.account,
						props.awsEnvironment.region,
					),
				],
			}),
		);

		applyPlatformTags(this, createPlatformTags(props.deploymentEnvironment));

		new CfnOutput(this, "GithubDeployRoleArn", {
			value: deployRole.roleArn,
		});
	}
}
