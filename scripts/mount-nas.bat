@echo off
REM scripts/mount-nas.bat

echo 🔗 NAS接続開始: 192.168.0.60/KNOW

REM ネットワークドライブとしてマウント
net use Z: \\192.168.0.60\KNOW /user:TKCoStrage nvn88wmxUGPFE87 /persistent:yes

if %errorlevel% equ 0 (
    echo ✅ NASマウント完了: Z:
    echo 📁 データパス: Z:\project-data
    dir Z:\
) else (
    echo ❌ NASマウント失敗
    exit /b 1
) 