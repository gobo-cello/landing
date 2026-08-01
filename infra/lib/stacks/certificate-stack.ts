import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import type { Construct } from "constructs";
import { applyPlatformTags, createPlatformTags } from "../config/tags";

export interface CertificateStackProps extends StackProps {
	readonly domainName: string;
}

export class CertificateStack extends Stack {
	public readonly certificate: Certificate;

	public constructor(
		scope: Construct,
		id: string,
		props: CertificateStackProps,
	) {
		super(scope, id, {
			...props,
			terminationProtection: true,
		});

		// landingはRoute 53 hosted zoneを所有しない(ADR 0006)ため、hostedZoneを
		// 渡せない。CertificateValidation.fromDns()はhosted zone引数を省略できる
		// 設計になっており、その場合はDNS検証用レコードをaws-platformへ手動連携する。
		this.certificate = new Certificate(this, "Certificate", {
			domainName: props.domainName,
			validation: CertificateValidation.fromDns(),
		});

		applyPlatformTags(this, createPlatformTags("production"));

		new CfnOutput(this, "CertificateArn", {
			value: this.certificate.certificateArn,
		});
	}
}
