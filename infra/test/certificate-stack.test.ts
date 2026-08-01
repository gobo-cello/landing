import { Template } from "aws-cdk-lib/assertions";
import { App } from "aws-cdk-lib/core";
import { describe, expect, it } from "vitest";
import { parseAwsAccountId } from "../lib/config/accounts";
import { CertificateStack } from "../lib/stacks/certificate-stack";

describe("CertificateStack", () => {
	const app = new App();
	const stack = new CertificateStack(app, "TestCertificateStack", {
		env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
		domainName: "example.com",
	});
	const template = Template.fromStack(stack);

	it("指定したdomainName用のACM証明書をDNS検証で1つ作成する", () => {
		template.resourceCountIs("AWS::CertificateManager::Certificate", 1);
		template.hasResourceProperties("AWS::CertificateManager::Certificate", {
			DomainName: "example.com",
			ValidationMethod: "DNS",
		});
	});

	it("Stack termination protectionを有効にする", () => {
		expect(stack.terminationProtection).toBe(true);
	});

	it("certificateをpublicプロパティとして公開する", () => {
		expect(stack.certificate).toBeDefined();
	});

	it("CertificateArnをCfnOutputとして出力する", () => {
		template.hasOutput("CertificateArn", {});
	});
});
