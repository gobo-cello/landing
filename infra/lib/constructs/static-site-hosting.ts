import type { RemovalPolicy } from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
	Function as CloudFrontFunction,
	Distribution,
	type ErrorResponse,
	FunctionCode,
	FunctionEventType,
	ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
	BlockPublicAccess,
	Bucket,
	BucketAccessControl,
	BucketEncryption,
	type IBucket,
	ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

/**
 * aws-cdk-libの`Bucket`は`isWebsite`等のoptional getterが`boolean | undefined`を
 * 返す一方、`IBucket`はそれを`boolean`(未設定時のみ省略可)として宣言しており、
 * `exactOptionalPropertyTypes: true`下では構造的代入がコンパイルエラーになる
 * (aws-cdk-lib側の既知の制約)。この関数はそのinterop境界でのみ型を合わせる。
 */
function asIBucket(bucket: Bucket): IBucket {
	return bucket as unknown as IBucket;
}

/**
 * CloudFrontの`defaultRootObject`はディストリビューションのルート("/")宛の
 * リクエストにしか適用されず、サブディレクトリ宛のリクエスト(例: "/posts/foo/")には
 * 効かない。そのままではS3オリジンに存在しないキー("posts/foo/")を問い合わせて
 * 403(OAC経由のprivate bucketは404の代わりに403を返す)になり、末尾スラッシュ付きの
 * ページが軒並み404になる。viewer requestの時点でURIへ"index.html"を補完する。
 */
const rewriteDirectoryIndexFunctionCode = FunctionCode.fromInline(`
function handler(event) {
	var request = event.request;
	var uri = request.uri;

	if (uri.endsWith("/")) {
		request.uri += "index.html";
	} else if (!uri.includes(".")) {
		request.uri += "/index.html";
	}

	return request;
}
`);

export interface StaticSiteHostingProps {
	readonly domainName: string;
	readonly certificate: ICertificate;
	readonly siteContentPath: string;
	readonly removalPolicy: RemovalPolicy;
	readonly autoDeleteObjects: boolean;
}

export class StaticSiteHosting extends Construct {
	public readonly distribution: Distribution;

	public constructor(
		scope: Construct,
		id: string,
		props: StaticSiteHostingProps,
	) {
		super(scope, id);

		const siteBucket = new Bucket(this, "SiteBucket", {
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			encryption: BucketEncryption.S3_MANAGED,
			enforceSSL: true,
			removalPolicy: props.removalPolicy,
			autoDeleteObjects: props.autoDeleteObjects,
		});

		const accessLogBucket = new Bucket(this, "AccessLogBucket", {
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			encryption: BucketEncryption.S3_MANAGED,
			enforceSSL: true,
			removalPolicy: props.removalPolicy,
			autoDeleteObjects: props.autoDeleteObjects,
			lifecycleRules: [{ expiration: Duration.days(90) }],
			// CloudFront標準アクセスログはACL経由でログ配信アカウントが書き込むため、
			// S3のデフォルト(ACL無効化)のままではDistribution作成がInvalidRequestで失敗する。
			objectOwnership: ObjectOwnership.OBJECT_WRITER,
			accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
		});

		const rewriteDirectoryIndexFunction = new CloudFrontFunction(
			this,
			"RewriteDirectoryIndexFunction",
			{ code: rewriteDirectoryIndexFunctionCode },
		);

		this.distribution = new Distribution(this, "Distribution", {
			defaultBehavior: {
				origin: S3BucketOrigin.withOriginAccessControl(asIBucket(siteBucket)),
				viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				functionAssociations: [
					{
						function: rewriteDirectoryIndexFunction,
						eventType: FunctionEventType.VIEWER_REQUEST,
					},
				],
			},
			domainNames: [props.domainName],
			certificate: props.certificate,
			defaultRootObject: "index.html",
			errorResponses: [
				{
					httpStatus: 404,
					responseHttpStatus: 404,
					responsePagePath: "/404.html",
				} satisfies ErrorResponse,
				{
					// private bucketをOrigin Access Control経由で参照する場合、
					// オブジェクトの存在有無を第三者へ漏らさないため、S3は存在しない
					// キーへのアクセスに404ではなく403 Access Deniedを返す。
					httpStatus: 403,
					responseHttpStatus: 404,
					responsePagePath: "/404.html",
				} satisfies ErrorResponse,
			],
			logBucket: asIBucket(accessLogBucket),
			logFilePrefix: "cloudfront-access-logs/",
		});

		new BucketDeployment(this, "SiteDeployment", {
			sources: [Source.asset(props.siteContentPath)],
			destinationBucket: asIBucket(siteBucket),
			distribution: this.distribution,
			// blogの構成と異なりビルドで生成されるハッシュ付きアセットを持たず、
			// サイト全体が数ファイルの素の静的HTML/CSSであるため、更新頻度に対して
			// 差分invalidationを維持するコストが見合わない。デプロイのたびに
			// 全体を無効化する(YAGNI)。
			distributionPaths: ["/*"],
		});
	}
}
