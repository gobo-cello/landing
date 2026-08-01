#!/usr/bin/env node
import path from "node:path";
import { App, RemovalPolicy } from "aws-cdk-lib/core";
import { loadLandingConfiguration } from "../lib/config/environments";
import { CertificateStack } from "../lib/stacks/certificate-stack";
import { GithubDeployRoleStack } from "../lib/stacks/github-deploy-role-stack";
import { HostingStack } from "../lib/stacks/hosting-stack";

const app = new App();
const configuration = loadLandingConfiguration();

// site/への絶対path。landingはbuildを持たない素の静的HTML/CSSであり、
// infraとは別のtop-levelディレクトリのため、実行ファイルからの相対pathで解決する。
const siteContentPath = path.join(__dirname, "..", "..", "site");

new GithubDeployRoleStack(app, "ProductionGithubDeployRoleStack", {
	env: configuration.production,
	awsEnvironment: configuration.production,
	deploymentEnvironment: "production",
});

const certificateStack = new CertificateStack(
	app,
	"ProductionCertificateStack",
	{
		env: configuration.production,
		domainName: configuration.apexDomainName,
	},
);

new HostingStack(app, "ProductionHostingStack", {
	env: configuration.production,
	deploymentEnvironment: "production",
	domainName: configuration.apexDomainName,
	certificate: certificateStack.certificate,
	siteContentPath,
	removalPolicy: RemovalPolicy.RETAIN,
	autoDeleteObjects: false,
});
