# landing

`example.com`のapex domain直下に静的ランディングページを配信するInfrastructure as Codeリポジトリです。

このリポジトリはpublicです。コード、設定、ドキュメント、Issue、Pull Requestなど、リポジトリ内のすべての情報は第三者から閲覧される前提で管理します。

## 目的

`example.com`のapex(ルートドメイン)直下に静的なランディングページを配信するアプリケーション、コンテンツ、ワークロード用インフラストラクチャをこのリポジトリで管理します。

apex hosted zoneの所有、AWS Organizations全体の共通基盤(監査ログの一元管理、Service Control Policyなど)は、ライフサイクルとfailure domainが異なるため、別のInfrastructure as Codeリポジトリ(`aws-platform`)で管理します。

## 管理対象

- ランディングページの静的コンテンツ(`site/`。Astro等のフレームワークは使用せず、素のHTML/CSS)
- ランディングページの本番環境(`landing-production`)向けワークロードインフラストラクチャ(`infra/`)
- GitHub ActionsとAWSのOIDC連携
- GitHub Actions用のIAM role

実装されていない項目については、今後このリポジトリへ段階的に追加します。

## 管理対象外

次の情報およびリソースは、このリポジトリでは管理しません。

- AWS Organizations、Management accountの設定
- CloudTrailログの一元管理、IAM Access Analyzerなど組織横断の監査・セキュリティ基盤
- Service Control Policy
- **apex hosted zoneの所有・DNSレコードの直接操作**(`aws-platform`リポジトリが所有する。このリポジトリはRoute 53 hosted zoneを一切持たず、ACM証明書のDNS検証レコードとCloudFrontのドメイン名を値としてのみ`aws-platform`へ手動連携する。設計の詳細は[aws-platformのADR 0006](../aws-platform/docs/adr/0006-apex-landing-page-exception.md)を参照)
- AWS root userの認証情報
- IAM Identity Centerのユーザーおよび認証情報
- 個人のメールアドレスや電話番号
- AWSアカウントの代替連絡先
- ドメインレジストラの認証情報
- Password、API key、access token、private keyなどのsecret
- ドメインそのものの登録および更新

これらは、組織レベルの共通基盤を管理する別のInfrastructure as Codeリポジトリ(`aws-platform`)で管理します。

## AWSアカウント構成

このリポジトリがデプロイ対象とするのは、次のAWSアカウントです。

- `landing-production`: 本番ランディングページのワークロード。sandbox環境は持ちません。

このアカウントは、AWS Organizations配下のProduction OUに所属します。Organizationsの管理、CloudTrailなどの監査ログ基盤、Management accountの運用は、`aws-platform`リポジトリの責務であり、このリポジトリでは前提として扱います。

実際のAWS account ID、Organization ID、メールアドレスなど、公開する必要のない環境固有情報はリポジトリへ保存しません。

## 認証方針

人間によるAWSへのアクセスにはIAM Identity Centerを使用します。

GitHub ActionsからAWSへのアクセスにはOpenID Connectを使用し、短時間のみ有効な一時認証情報を取得します。

長期的なAWS access keyは使用しません。

## Public repositoryとしての方針

このリポジトリには、公開されても問題のない情報だけを保存します。

次の情報を、コード、設定ファイル、ドキュメント、ログ、コメント、Issue、Pull Requestへ含めてはいけません。

- AWS access key
- AWS session token
- Password
- MFA seed
- Private key
- API key
- GitHub personal access token
- 個人のメールアドレスや電話番号
- AWS root userに関する情報
- その他のsecretまたは個人情報

環境固有の値が必要な場合は、次のいずれかを使用します。

- ローカルの環境変数
- GitHub Actions Variables
- GitHub Environment Variables
- GitHub Secrets
- AWS Systems Manager Parameter Store
- AWS Secrets Manager

AWS認証情報そのものはGitHub Secretsへ保存せず、OIDCを使用します。

## ディレクトリ構成

リポジトリ直下に共通の開発ツール設定を置き、CDK applicationは`infra/`、配信するランディングページ本体は`infra/`と衝突しない`site/`ディレクトリで管理します。`site/`はビルドを持たない素の静的HTML/CSSであり、独立したnpm projectではありません。

```text
landing/
├── infra/                # AWS CDK application(独立npm project)
│   ├── bin/               # CDK applicationのentry point
│   ├── lib/
│   │   ├── config/         # secretを含まない環境設定
│   │   ├── constructs/     # 複数のAWS resourceからなる論理的な機能単位
│   │   └── stacks/         # AWS accountまたはdeployment boundaryごとのStack
│   ├── test/               # CDK templateおよびConstructのテスト
│   ├── cdk.json
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── site/                  # 静的ランディングページ本体(ビルド不要)
│   ├── index.html
│   ├── styles.css
│   └── 404.html
├── .github/
│   ├── actions/
│   ├── workflows/
│   └── copilot-instructions.md
├── .claude/
│   └── CLAUDE.md
├── .gitignore
├── .node-version
├── .npmrc
├── lefthook.yml
├── package.json
├── README.md
└── SECURITY.md
```

このツリーは各ディレクトリの役割を示す骨格であり、網羅的なファイル一覧ではありません。テストファイルなど、実装の追加に伴って増減するファイルは列挙していないため、それらを追加・変更してもこの一覧を更新する必要はありません。実際に存在するファイルは各ディレクトリを直接参照してください。

`infra/`配下は次の責務で分割しています。

- `infra/bin/`: CDK applicationのentry point
- `infra/lib/stacks/`: AWS accountまたはdeployment boundaryごとのStack(`GithubDeployRoleStack`・`CertificateStack`・`HostingStack`)
- `infra/lib/constructs/`: 複数のAWS resourceからなる論理的な機能単位
- `infra/lib/config/`: secretを含まない環境設定
- `infra/test/`: CDK templateおよびConstructのテスト

使用されていないStack、Construct、directory、設定ファイルは先行して作成しません。

## 開発環境

必要なtoolは次のとおりです。

- Git
- Node.js(バージョンは`.node-version`を参照)
- npm
- AWS CLI
- AWS CDK CLI

リポジトリ直下・`infra/`はそれぞれ独立したnpm projectです。

リポジトリ直下の依存関係(lint、git hooks)をインストールします。

```sh
npm ci
```

`infra/`の依存関係をインストールします。

```sh
cd infra
npm ci
```

TypeScriptを型チェックします。

```sh
cd infra
npm run build
```

テストを実行します。

```sh
cd infra
npm test
```

CloudFormation templateを生成します。

```sh
cd infra
npx cdk synth
```

## Lintとgit hooks

このリポジトリはLintに[Biome](https://biomejs.dev/)を使用します。

```sh
npm run check
```

git hooksには[lefthook](https://github.com/evilmartians/lefthook)を使用します。`npm ci`実行時に`prepare`スクリプトが自動的に`lefthook install`を実行します。

- pre-commit: 変更されたファイルへBiomeを適用します。
- pre-push: `infra/`でbuild、テスト、`cdk synth`を実行します。
- commit-msg: Conventional Commitsの形式を検証します。

## AWS CLIプロファイル

人間によるAWSへのアクセスにはIAM Identity Center(AWS SSO)を使用し、長期的なAWS access keyは使用しません。

ローカルの`~/.aws/config`に、account・role単位でprofileを分けて設定します。実際のaccount IDやSSO start URLはリポジトリへ保存しないため、プレースホルダーで示します。

```ini
[profile landing-production]
sso_session = gobo-cello
sso_account_id = 実際のProduction account ID
sso_role_name = AdministratorAccess
region = us-east-1
output = json

[sso-session gobo-cello]
sso_start_url = 実際のSSO Start URL
sso_region = us-east-1
sso_registration_scopes = sso:account:access
```

`aws sso login --profile landing-production`でログインしてから、`--profile`オプションでコマンドを実行します。

## GitHub ActionsとAWSの接続

GitHub ActionsからAWSへは、OIDCによる一時認証だけを使用します。長期的なAWS access keyは発行しません。

`infra/`には、GitHub ActionsがOIDCでdeployするための`ProductionGithubDeployRoleStack`が定義されています。GitHub Actions自身は自分のtrust関係を初回だけ自動デプロイできないため(chicken-and-egg、`blog`リポジトリのADR 0002と同じ問題)、次の手順を人手で1回だけ行う必要があります。

1. ローカルのAdministratorAccess profileで、`landing-production` accountにCDK bootstrapを実行します。

   ```sh
   cd infra
   npx cdk bootstrap aws://<Production account ID>/us-east-1 --profile landing-production
   ```

2. `infra/.env.local`(gitignore対象、`.env.example`を元に作成)にaccount IDとapex domain名を設定し、ローカルから初回だけ手動でdeployします。`.env.local`は`cdk.json`の`app`コマンドが`--env-file-if-exists`で自動読み込みするため、`cdk synth`・`cdk deploy`実行前に手動でsourceする必要はありません。

   ```sh
   cd infra
   npx cdk deploy ProductionGithubDeployRoleStack --profile landing-production
   ```

3. deploy出力の`GithubDeployRoleArn`を控えます。

4. GitHubリポジトリに Environment `production` を作成し、Required Reviewersを設定します。

5. 次のGitHub Variablesを登録します。

   - Repository Variable: `AWS_LANDING_PRODUCTION_ACCOUNT_ID`
   - Environment `production` Variables: `AWS_LANDING_PRODUCTION_DEPLOY_ROLE_ARN`(手順3のARN)、`APEX_DOMAIN_NAME`、`BLOG_DOMAIN_NAME`(`site/index.html`の`{{BLOG_DOMAIN_NAME}}`へdeploy時に埋め込むリンク先ドメイン)

以降は、`main`へのmergeによる`deploy.yml`の自動実行で運用します。

## ドメインとDNSの連携手順

`landing`リポジトリはRoute 53 hosted zoneを一切所有しません。apex hosted zone(`example.com`)は`aws-platform`リポジトリのmanagement accountが所有しており、「apex hosted zoneはサブドメインへのNS delegationレコード以外を持たない」という原則があります(`aws-platform`のADR 0005)。`landing`が配信する対象は apex そのものであり、NS delegationでzoneごと譲渡することはできないため、`aws-platform`のADR 0006により、この用途に限定した例外として、値を手動連携してapex hosted zoneへ直接レコードを追加する運用にしています。設計の背景は[aws-platformのADR 0006](../aws-platform/docs/adr/0006-apex-landing-page-exception.md)を参照してください。

ACM証明書は`CertificateValidation.fromDns()`(hosted zone引数なし)で発行します。この場合、CDKはDNS検証用レコードを自動作成せず、`aws acm describe-certificate`等で確認した値を手動で連携する設計に公式になっています。CloudFront Distributionのドメイン名(alias target)も同様に値だけを連携し、cross-accountのIAM書き込み権限や live lookupは一切使用しません(却下した代替案も含め、詳細はADR 0006を参照)。

以下が、初回セットアップからapex配信開始までの手動ランブックです。🧑は人間が1回だけ実施する手順、それ以外はCDKやCIが行う手順です。

1. 🧑 新規AWSアカウント(`landing-production`)をAWS Organizationsで作成し、Production OUへ配置します(`aws-platform`側の管理範囲)。

2. 🧑 `gh repo create gobo-cello/landing` でリポジトリを作成し、このディレクトリの内容をpushします。

3. 🧑 上記「GitHub ActionsとAWSの接続」の手順1〜5(CDK bootstrap、`ProductionGithubDeployRoleStack`の初回手動deploy、GitHub Environment作成、Variables登録)を実施します。

4. 🧑 `CertificateStack`をローカルから手動でdeployします。

   ```sh
   cd infra
   npx cdk deploy ProductionCertificateStack --profile landing-production
   ```

5. 🧑 `aws acm describe-certificate`等でACM証明書のDNS検証用レコード(`ResourceRecord`の`Name`と`Value`)を取得します。

6. 🧑 取得した値を`aws-platform`リポジトリのGitHub Variables(`APEX_LANDING_CERT_VALIDATION_RECORD_NAME`・`APEX_LANDING_CERT_VALIDATION_RECORD_VALUE`)に設定し、`aws-platform`の`DnsStack`をdeployします。これにより、apex hosted zoneへ検証用CNAMEレコードが反映されます。

7. ACMが検証用CNAMEを検出し、証明書のステータスが`ISSUED`になるまで待ちます(数分〜数十分かかる場合があります)。

8. 🧑 証明書が`ISSUED`になったら、`CertificateStack`のdeployを再実行して完了させます(手順4と同じコマンド)。

9. 🧑 `HostingStack`をローカルから手動でdeployします。

   ```sh
   cd infra
   npx cdk deploy ProductionHostingStack --profile landing-production
   ```

10. 🧑 deploy出力の`DistributionDomainName`(CloudFrontのドメイン名)を控えます。

11. 🧑 取得した値を`aws-platform`リポジトリのGitHub Variables(`APEX_LANDING_CLOUDFRONT_DOMAIN_NAME`)に設定し、`aws-platform`の`DnsStack`を再度deployします。これにより、apex宛のA/AAAA(dual-stack) aliasレコードが反映されます。

12. 🧑 `dig example.com A`・`dig example.com AAAA`でapex宛のレコードが解決すること、`curl -sI https://example.com`が200を返すこと、`curl -sI https://example.com/nonexistent`が404(`site/404.html`)を返すことを確認します。あわせて`dig blog.example.com NS`で既存のNS delegationが壊れていないことも確認します。

13. 🧑 動作確認できたら、`deploy.yml`の`production` jobへ`ProductionCertificateStack`・`ProductionHostingStack`を追加するコミット(すでに`bin/infra.ts`に組み込み済みのため、`deploy.yml`は初回セットアップ時点で完成しています)が正しく`main`へのpushで自動実行されることを確認します。以降、`infra/**`または`site/**`の変更が`main`へmergeされるたびに、`ProductionGithubDeployRoleStack` → `ProductionCertificateStack` → `ProductionHostingStack`の順で自動デプロイされます。

`aws-platform`側の対応する変更(env var追加、`DnsStack`の拡張)は別リポジトリのPRとして扱います。B(`aws-platform`の変更)は全てoptional propのため、この手動ランブックの実施前に単独でPRを作成・マージできます。

## Git運用

`main` branchは常にbuild、test、CDK synthが成功する状態を維持します。

変更は原則として作業branchで行い、Pull Requestを通じて`main`へmergeします。

Commit messageはConventional Commitsに従います。

```text
<type>(<scope>): <日本語の要約>
```

例:

```text
feat(infra): ランディングページ配信用CloudFrontディストリビューションを追加
test(infra): S3 bucket policyのテストを追加
docs(readme): DNS連携手順を更新
chore(deps): AWS CDKを更新
```

## Security

脆弱性またはsecretの漏えいを発見した場合は、public Issueへ詳細を投稿しないでください。

対応方法については[`SECURITY.md`](./SECURITY.md)を参照してください。

## License

Licenseは別途決定します。Licenseを追加するまでは、著作権者から明示的に許可された範囲を除き、コードの利用、複製、変更、再配布は許諾されません。
