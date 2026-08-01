import type { AwsAccountId } from "./accounts";
import type { AwsRegion } from "./environments";

declare const iamRoleArnBrand: unique symbol;

export type IamRoleArn = string & {
	readonly [iamRoleArnBrand]: "IamRoleArn";
};

const cdkBootstrapQualifier = "hnb659fds";

function createCdkBootstrapRoleArn(
	roleName: string,
	accountId: AwsAccountId,
	region: AwsRegion,
): IamRoleArn {
	return (`arn:aws:iam::${accountId}:role/` +
		`cdk-${cdkBootstrapQualifier}-${roleName}-${accountId}-${region}`) as IamRoleArn;
}

export function createCdkDeployRoleArn(
	accountId: AwsAccountId,
	region: AwsRegion,
): IamRoleArn {
	return createCdkBootstrapRoleArn("deploy-role", accountId, region);
}

export function createCdkFilePublishingRoleArn(
	accountId: AwsAccountId,
	region: AwsRegion,
): IamRoleArn {
	return createCdkBootstrapRoleArn("file-publishing-role", accountId, region);
}

export function createCdkLookupRoleArn(
	accountId: AwsAccountId,
	region: AwsRegion,
): IamRoleArn {
	return createCdkBootstrapRoleArn("lookup-role", accountId, region);
}
