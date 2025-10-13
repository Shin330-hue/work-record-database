# 開発メモ (監査ログ機能)

## 2025-10-11
- 監査ログ基盤を実装。`src/lib/auditLogger.ts` で JSONL 形式の追記処理と、`public/data/audit/` への保存方針を決定。
- 管理画面の API 呼び出しに社員 ID / 氏名ヘッダーを付与（`src/lib/auth/client.ts`、`getAuthHeaders*`）。図番新規登録 API から `logAuditEvent` を呼び出して `drawing.create` を記録。
- `fetch` が非 ASCII ヘッダーを拒否する問題に遭遇。ヘッダー側で `encodeURIComponent`、サーバー側で `decodeURIComponent` する方針に修正して解決。
- `public/data/audit/audit-YYYY-MM.jsonl` へログが出力されることを確認。管理者ユーザーによる図番登録 (0A1490029) が正常に記録される。
- フォルダ構成に合わせて `public/data/audit/` を新設。今後は更新・削除、ファイル操作、認証イベントにもログ拡張予定。

> 仕様書とは別に、問題発生時の経緯や判断理由をこのメモに追加していく。
## 2025-10-11 (続き)
- 図番更新API (`src/app/api/admin/drawings/[id]/route.ts`) に監査ログ処理を追加。更新成功後に `drawing.update` を記録し、タイトル・会社/製品IDをメタデータ化。
- クライアント送信用ヘッダーを URL エンコードするよう修正し（ASCII 制約対応）、サーバー側でデコードするように調整。
- `public/data/audit/audit-2025-10.jsonl` に更新ログも追記されることを確認予定。

## 2025-10-11 (更新API取り込み調整中)
- 図番更新APIへの監査ログ追加を試みたが、PowerShell の置換処理でテンプレート文字列が壊れ、ビルドエラーが発生。
- git checkout -- src/app/api/admin/drawings/[id]/route.ts で元の実装に戻して安定状態を確保。
- 差分を抽出する関数を先に実装し、段階的に監査ログへ取り込む方針で再計画する。

## 2025-10-11 (監査ログ進捗メモ)
- 監査ログ基盤と新規登録ログ (drawing.create) は安定して稼働。
- 図番更新ログで差分比較を入れようとして一度失敗し、git checkout で元に戻して再計画中。
- 差分をどこまで記録するか整理し、シンプル案を検討してから再実装することにした。
