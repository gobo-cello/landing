import { Match, Template } from "aws-cdk-lib/assertions";
import { App } from "aws-cdk-lib/core";
import { describe, expect, it } from "vitest";
import { parseAwsAccountId } from "../lib/config/accounts";
import { GithubDeployRoleStack } from "../lib/stacks/github-deploy-role-stack";

function synthesize() {
	const app = new App();
	const awsEnvironment = {
		account: parseAwsAccountId("111111111111"),
		region: "us-east-1" as const,
	};

	const stack = new GithubDeployRoleStack(app, "TestProductionStack", {
		env: awsEnvironment,
		awsEnvironment,
		deploymentEnvironment: "production",
	});

	return { stack, template: Template.fromStack(stack) };
}

describe("GithubDeployRoleStack(production)", () => {
	const { stack, template } = synthesize();

	it("GitHub Actions用のOIDC providerを1つ作成する", () => {
		template.resourceCountIs("AWS::IAM::OIDCProvider", 1);
		template.hasResourceProperties("AWS::IAM::OIDCProvider", {
			Url: "https://token.actions.githubusercontent.com",
			ClientIdList: ["sts.amazonaws.com"],
		});
	});

	it("sub claimをproduction環境に限定したtrust policyを作成する", () => {
		template.hasResourceProperties("AWS::IAM::Role", {
			AssumeRolePolicyDocument: Match.objectLike({
				Statement: Match.arrayWith([
					Match.objectLike({
						Action: "sts:AssumeRoleWithWebIdentity",
						Effect: "Allow",
						Condition: {
							StringEquals: {
								"token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
							},
							StringLike: {
								"token.actions.githubusercontent.com:sub":
									"repo:gobo-cello@*/landing@*:environment:production",
							},
						},
					}),
				]),
			}),
		});
	});

	it("CDK bootstrapの3つのroleへのAssumeRoleだけを許可する", () => {
		template.hasResourceProperties("AWS::IAM::Policy", {
			PolicyDocument: Match.objectLike({
				Statement: Match.arrayWith([
					Match.objectLike({
						Action: "sts:AssumeRole",
						Effect: "Allow",
						Resource: [
							"arn:aws:iam::111111111111:role/cdk-hnb659fds-deploy-role-111111111111-us-east-1",
							"arn:aws:iam::111111111111:role/cdk-hnb659fds-file-publishing-role-111111111111-us-east-1",
							"arn:aws:iam::111111111111:role/cdk-hnb659fds-lookup-role-111111111111-us-east-1",
						],
					}),
				]),
			}),
		});
	});

	it("Stack termination protectionを有効にする", () => {
		expect(stack.terminationProtection).toBe(true);
	});
});
