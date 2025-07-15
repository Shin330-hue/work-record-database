@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM ログファイルを初期化（上書き）
echo [%date% %time%] サーバー起動処理を開始しています... > server.log
echo [%date% %time%] 作業ディレクトリ: %cd% >> server.log

REM 環境変数をチェック
echo [%date% %time%] 環境変数をチェックしています... >> server.log
if exist .env.local (
    echo [%date% %time%] .env.local ファイルが見つかりました >> server.log
) else (
    echo [%date% %time%] 警告: .env.local ファイルが見つかりません >> server.log
)

REM サーバーをバックグラウンドで起動し、出力をログファイルにリダイレクト
echo [%date% %time%] npm run start コマンドを実行中... >> server.log
start /min cmd /c "chcp 65001 >nul && npm run start -- --hostname 192.168.0.58 --port 80 >> server.log 2>&1"

REM 少し待機してプロセス確認
timeout /t 3 /nobreak >nul

REM 起動確認
netstat -ano | findstr :80 | findstr LISTENING >nul
if !errorlevel! == 0 (
    echo [%date% %time%] サーバーが正常に起動しました（ポート 80 で待機中） >> server.log
) else (
    echo [%date% %time%] 警告: サーバーの起動確認ができませんでした >> server.log
)

echo [%date% %time%] 起動処理が完了しました >> server.log