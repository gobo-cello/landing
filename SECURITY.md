# Security Policy

## セキュリティ上の問題を報告する方法

脆弱性、secretの漏えい、過剰なIAM permission、危険なresource policyなどを発見した場合は、public Issueやpublic Discussionへ詳細を投稿しないでください。

GitHubのPrivate vulnerability reportingが有効な場合は、リポジトリのSecurityページから非公開で報告してください。

Private vulnerability reportingが利用できない場合は、機密情報を含まない範囲で、リポジトリ管理者へ連絡する方法を確認してください。

報告には、可能な範囲で次の情報を含めてください。

- 問題の概要
- 影響を受けるfile、workflow、AWS resourceまたは設定
- 想定される影響
- 再現に必要な最小限の手順
- 推奨する修正方法

実際のcredential、secret、個人情報、AWS account ID、Organization ID、メールアドレスなどは報告本文へ含めないでください。

## 対象範囲

このSecurity Policyは、次を対象とします。

- ランディングページのコンテンツ(`site/`)
- AWS CDK code(`infra/`)
- CloudFormation template
- IAM policy
- IAM role trust policy
- S3 bucket policy
- CloudFront distribution設定
- KMS key policy
- GitHub Actions workflow
- GitHub Actions permission
- OIDC trust condition
- Repository configuration
- Dependencyおよびbuild process
- Documentationに含まれるセキュリティ上の問題

AWS、GitHub、npm packageなど、第三者のserviceやsoftware自体の脆弱性は、それぞれの提供者へ報告してください。

## リポジトリへ保存してはいけない情報

このリポジトリには、次の情報を保存してはいけません。

- AWS access key ID
- AWS secret access key
- AWS session token
- Password
- MFA seedまたはQR code
- Private key
- API key
- OAuth token
- GitHub personal access token
- Webhook secret
- Cookieまたはsession情報
- 個人のメールアドレス
- 個人の電話番号
- 住所などの個人情報
- AWS root userのメールアドレスまたは復旧情報
- IAM Identity Centerの認証情報
- その他、第三者に公開すべきでない情報

これらは、source codeだけでなく、次の場所にも含めてはいけません。

- Git history
- Commit message
- Branch name
- Tag
- Issue
- Pull Request
- Review comment
- GitHub Actions log
- Test fixture
- Snapshot
- Sample file
- Documentation
- Screenshot

## AWS認証方針

GitHub ActionsからAWSへの認証にはOpenID Connectを使用します。

長期的なAWS access keyを、GitHub Secrets、repository file、workflow file、local configurationへ保存してはいけません。

OIDCを利用するIAM roleのtrust policyは、少なくとも次の条件で制限します。

- GitHub organization: `gobo-cello`
- GitHub repository: `landing`
- 使用を許可するbranchまたはGitHub Environment
- Audience: `sts.amazonaws.com`

Wildcardを使用して、無関係なrepositoryやbranchからroleを引き受けられる設定にしてはいけません。

## GitHub Actionsの方針

GitHub Actions workflowは、必要最小限のpermissionで実行します。

Defaultのpermissionはread-onlyとし、各workflowまたはjobで必要なpermissionだけを明示します。

AWS OIDC tokenが必要なjobだけ、次のpermissionを付与します。

```yaml
permissions:
  contents: read
  id-token: write
```

外部のGitHub Actionは、可能な限りcommit SHAで固定します。

```yaml
- uses: actions/checkout@<commit-sha> # vX.Y.Z
```

変更可能なbranch名やmajor version tagだけに依存しないようにします。

Pull Requestから実行されるworkflowでは、forkされたrepositoryや信頼されていないcodeがsecretまたはAWS permissionへアクセスできないようにします。

## Secretをcommitした場合

Secretをcommitした可能性がある場合は、Git historyから削除するだけでは不十分です。

次の順序で対応します。

1. 該当するcredentialまたはsecretを直ちに無効化する
2. 新しいcredentialまたはsecretへrotationする
3. 利用履歴と監査logを確認する
4. 影響範囲を特定する
5. RepositoryとGit historyから値を削除する
6. 同様の漏えいを防ぐ仕組みを追加する

AWS credentialの場合は、CloudTrailなどを使用して不正利用の有無を確認します。

Secretを削除する前に、無効化またはrotationを先に実施してください。

## Dependencyの脆弱性

Dependencyは次の仕組みで継続的に確認します。

* GitHub Dependency graph
* Dependabot alerts
* Dependabot security updates
* npm audit
* GitHub CodeQL

脆弱性が報告された場合は、影響範囲を確認し、互換性を検証したうえで、可能な限り速やかに安全なversionへ更新します。

## Public disclosure

修正が完了する前に、脆弱性の詳細、悪用方法、実際のresource identifier、credentialなどを公開しないでください。

修正完了後に情報を公開する場合も、credential、個人情報、環境固有の機密情報を除外してください。
