# 開発の進め方

Issueに目的・受入条件を記録し、作業branchで実装します。意味のある単位でcommitし、作業branchへpushしてPRを作成します。CIとレビュー、受入条件を確認してからdefault branchへmergeします。

`push` はmainへ直接送る操作ではありません。基本は **作業branchへpush → PR → CI確認 → merge** です。

Issueにはタスクと経緯、PRには変更と検証、docsには確定した設計を残します。Projectは進捗一覧です。作業開始はIn Progress、PR準備完了はReview、3回の意味ある試行が失敗して未解決ならBlocked、mergeと受入条件の確認後にDoneにします。

秘密情報・認証情報・個人情報はcommitやIssue/PRへ載せません。環境変数の例にはダミー値を使います。

## 導入状況

最終確認日: 2026-09-19

| 項目 | 状態 | 根拠・未対応理由 |
| --- | --- | --- |
| Repository instructions | 設定済み | `AGENTS.md`, `CLAUDE.md` |
| Issue templates | 設定済み | `.github/ISSUE_TEMPLATE/` |
| Pull request template | 設定済み | `.github/pull_request_template.md` |
| CI | 設定済み | `.github/workflows/ci.yml` の必須チェック `verify` |
| GitHub Pages | 設定済み | `.github/workflows/pages.yml`、main更新時に静的PWAを公開 |
| Branch protection | 設定済み | mainはPR必須、`verify`必須、linear history、force push・削除禁止。2026-09-19 readback済み |
| Development HQ | 同期済み | `SHOHE001` Project #1、Issue #1を登録 |
| Remote | 設定済み | https://github.com/SHOHE001/donguri-yamaneko-pwa |

## 公開先

- GitHub Pages: https://shohe001.github.io/donguri-yamaneko-pwa/
- 公開処理: mainへのmerge後、`Deploy GitHub Pages` workflowがテスト・静的検査・成果物作成・デプロイを行う。
