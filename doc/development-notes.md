# 開発メモ (監査ログ・管理ダッシュボード)

## 2025-10-11
- src/lib/auditLogger.ts に JSONL 形式の監査ログ基盤を実装し、public/data/audit/ へ出力する仕組みを整備。
- 管理 API 呼び出しに社員 ID／氏名ヘッダーを付与（src/lib/auth/client.ts）し、新規登録 API から logAuditEvent を呼び出して drawing.create を記録。
- etch 呼び出しが非 ASCII ヘッダーを拒否する不具合に対応し、クライアント側で encodeURIComponent、サーバー側で decodeURIComponent する方針に修正。
- public/data/audit/audit-YYYY-MM.jsonl にログが出力されることを確認。管理者ユーザーによる図番登録 (0A1490029) が記録できた。
- 監査ログ用の public/data/audit/ ディレクトリを新設（将来の更新・削除ログ拡張を想定）。

## 2025-10-11 (図番更新 API 調整)
- src/app/api/admin/drawings/[id]/route.ts に監査ログ (drawing.update) を追加し、タイトル・会社／製品 ID などをメタデータ化。
- PowerShell 置換でテンプレートが崩れたため git checkout で実装を戻し、差分抽出関数を先に用意する方針で再計画。

## 2025-10-11 (ダッシュボード導線整理)
- 管理ダッシュボードに「追記管理」カードを復活させ、/admin/contributions への導線を再整備。
- 監査ログ導線追加時に誤って削除したリンクを復旧。

## 2025-10-13 (監査ログ API 拡張)
- 図番更新 API に logAuditEvent を組み込み、主要フィールド差分（タイトル・難易度・所要時間など）を changes / changedFields として記録。
- 追記管理 API のステータス更新／削除処理に contribution.updateStatus / contribution.delete を追加し、削除時は対象ユーザーや添付ファイル情報も記録。
- 図番ファイル一括アップロード／単体アップロード API に drawing.files.upload / drawing.files.delete を追加。
- /admin/audit-log を新設し、直近 200 件の監査ログを閲覧できるページを実装。アクション別フィルタ・期間フィルタを追加。

## 2025-10-13 (管理ダッシュボード UI 微調整)
- 管理レイアウトに dmin-theme を導入し、閲覧ページとテーマを切り分け。
- 統計カードを flex-wrap + 最小／最大幅でレイアウトし、横並びでも折り返しでも見やすくなるよう調整。アイコン・余白・フォントサイズも縮小。
- 管理メニューと最新追記カードをカスタムクラスで整理し、モバイルでも読みやすいレイアウトに刷新。

## 2025-10-13 (管理画面フォーム配色調整)
- 管理ダッシュボードの統計カードとクイックリンクカードへテーマカラー別のグラデーションとボーダーを追加し、背景 #f3f4f6 上でもカードが埋もれないように調整。
- 新規図番登録フォームのラベル色、区切り線、ドロップダウン配色をライトテーマ向けに刷新し、チェックボックスや選択肢の文字色も見直して視認性を確保。
