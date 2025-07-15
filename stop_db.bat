@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo サーバーを終了しています...

REM ポート80で動作するプロセスを検索・終了
echo ポート 80 で動作するプロセスを検索中...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :80 ^| findstr LISTENING') do (
    echo PID %%i のプロセスを終了しています...
    taskkill /f /pid %%i
    if !errorlevel! == 0 (
        echo プロセス %%i が正常に終了しました
    ) else (
        echo プロセス %%i の終了に失敗しました
    )
)

REM プロセスが見つからない場合の処理
netstat -ano | findstr :80 | findstr LISTENING >nul
if !errorlevel! == 1 (
    echo ポート 80 で動作するプロセスが見つかりませんでした
)

echo.
echo サーバー終了処理が完了しました
echo 3秒後にウィンドウを閉じます...
timeout /t 3 /nobreak >nul