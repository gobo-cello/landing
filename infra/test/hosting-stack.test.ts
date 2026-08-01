import path from "node:path";
import { Match, Template } from "aws-cdk-lib/assertions";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { App, RemovalPolicy, Stack } from "aws-cdk-lib/core";
import { describe, expect, it } from "vitest";
import { parseAwsAccountId } from "../lib/config/accounts";
import { HostingStack } from "../lib/stacks/hosting-stack";

const fixtureSiteContentPath = path.join(__dirname, "fixtures", "static-site");

function synthesize() {
	const app = new App();
	const certificateStack = new Stack(app, "TestCertificateStack", {
		env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
	});
	// landingはRoute 53 hosted zoneを所有しない(ADR 0006)ため、blogのように
	// HostedZoneからCertificateValidation.fromDns(zone)を組み立てられない。
	// 実際のstackと同じ、zone引数なしのfromDns()で証明書を用意する。
	const certificate = new Certificate(certificateStack, "Certificate", {
		domainName: "example.com",
		validation: CertificateValidation.fromDns(),
	});

	const stack = new HostingStack(app, "TestProductionHostingStack", {
		env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
		deploymentEnvironment: "production",
		domainName: "example.com",
		certificate,
		siteContentPath: fixtureSiteContentPath,
		removalPolicy: RemovalPolicy.RETAIN,
		autoDeleteObjects: false,
	});

	return { stack, template: Template.fromStack(stack) };
}

describe("HostingStack(production)", () => {
	const { stack, template } = synthesize();

	it("CloudFront Distributionを1つ作成する", () => {
		template.resourceCountIs("AWS::CloudFront::Distribution", 1);
		template.hasResourceProperties("AWS::CloudFront::Distribution", {
			DistributionConfig: Match.objectLike({
				Aliases: ["example.com"],
			}),
		});
	});

	it("removalPolicy(RETAIN)をS3 bucketへ適用する", () => {
		template.hasResource("AWS::S3::Bucket", {
			DeletionPolicy: "Retain",
		});
	});

	it("Stack termination protectionを有効にする", () => {
		expect(stack.terminationProtection).toBe(true);
	});

	it("DistributionDomainNameをCfnOutputとして出力する", () => {
		template.hasOutput("DistributionDomainName", {});
	});

	it("Route53 recordを作成しない(apex hosted zoneはaws-platformが所有し、値の手動連携でのみ反映する)", () => {
		template.resourceCountIs("AWS::Route53::RecordSet", 0);
	});
});
