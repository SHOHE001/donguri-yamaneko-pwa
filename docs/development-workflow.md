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
| CI | 設定済み | `.github/workflows/ci.yml` の `npm test`, `npm run check`。GitHub未同期のため実行結果は未確認 |
| Branch protection | 未確認 | 対応するGitHubリポジトリが未作成 |
| Development HQ | 未同期 | Issue/PR URLがなく登録対象がない |
| Remote | 未設定 | 公開先と可視性を推測しないためローカルのみ |
