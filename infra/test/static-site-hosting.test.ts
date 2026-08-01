import path from "node:path";
import { Match, Template } from "aws-cdk-lib/assertions";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { App, RemovalPolicy, Stack } from "aws-cdk-lib/core";
import { describe, it } from "vitest";
import { parseAwsAccountId } from "../lib/config/accounts";
import { StaticSiteHosting } from "../lib/constructs/static-site-hosting";

const fixtureSiteContentPath = path.join(__dirname, "fixtures", "static-site");

describe("StaticSiteHosting", () => {
	function synthesize() {
		const app = new App();
		const stack = new Stack(app, "TestStaticSiteHostingStack", {
			env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
		});
		const certificate = new Certificate(stack, "TestCertificate", {
			domainName: "example.com",
			validation: CertificateValidation.fromDns(),
		});

		new StaticSiteHosting(stack, "StaticSiteHosting", {
			domainName: "example.com",
			certificate,
			siteContentPath: fixtureSiteContentPath,
			removalPolicy: RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
		});

		return Template.fromStack(stack);
	}

	const template = synthesize();

	it("privateなS3 bucketをサイト配信用に作成する", () => {
		template.hasResourceProperties("AWS::S3::Bucket", {
			PublicAccessBlockConfiguration: {
				BlockPublicAcls: true,
				BlockPublicPolicy: true,
				IgnorePublicAcls: true,
				RestrictPublicBuckets: true,
			},
		});
	});

	it("CloudFront DistributionをOAC経由のS3 originで作成する", () => {
		template.resourceCountIs("AWS::CloudFront::Distribution", 1);
		template.hasResourceProperties("AWS::CloudFront::Distribution", {
			DistributionConfig: Match.objectLike({
				Aliases: ["example.com"],
				DefaultRootObject: "index.html",
				CustomErrorResponses: Match.arrayWith([
					Match.objectLike({
						ErrorCode: 404,
						ResponseCode: 404,
						ResponsePagePath: "/404.html",
					}),
					Match.objectLike({
						ErrorCode: 403,
						ResponseCode: 404,
						ResponsePagePath: "/404.html",
					}),
				]),
			}),
		});
		template.resourceCountIs("AWS::CloudFront::OriginAccessControl", 1);
	});

	it("サブディレクトリ配下のindex.htmlへ補完するCloudFront Functionをviewer requestに関連付ける", () => {
		template.resourceCountIs("AWS::CloudFront::Function", 1);
		template.hasResourceProperties("AWS::CloudFront::Function", {
			FunctionConfig: Match.objectLike({
				Runtime: "cloudfront-js-1.0",
			}),
		});
		template.hasResourceProperties("AWS::CloudFront::Distribution", {
			DistributionConfig: Match.objectLike({
				DefaultCacheBehavior: Match.objectLike({
					FunctionAssociations: Match.arrayWith([
						Match.objectLike({ EventType: "viewer-request" }),
					]),
				}),
			}),
		});
	});

	it("CloudFrontの標準アクセスログを別バケットへ出力する", () => {
		template.hasResourceProperties("AWS::CloudFront::Distribution", {
			DistributionConfig: Match.objectLike({
				Logging: Match.objectLike({
					Prefix: "cloudfront-access-logs/",
				}),
			}),
		});
	});

	it("アクセスログ用bucketはCloudFront標準ログのACL書き込みを許可する", () => {
		template.hasResourceProperties("AWS::S3::Bucket", {
			AccessControl: "LogDeliveryWrite",
			OwnershipControls: {
				Rules: [{ ObjectOwnership: "ObjectWriter" }],
			},
		});
	});

	it("Route53 recordを作成しない(hosted zoneを所有しないため、aliasレコードはこのconstructの責務外)", () => {
		template.resourceCountIs("AWS::Route53::RecordSet", 0);
	});

	it("BucketDeploymentでサイトコンテンツを同期する", () => {
		template.resourceCountIs("Custom::CDKBucketDeployment", 1);
	});

	it("CloudFront invalidationはサイト全体を対象にする", () => {
		template.hasResourceProperties("Custom::CDKBucketDeployment", {
			DistributionPaths: ["/*"],
		});
	});
});
