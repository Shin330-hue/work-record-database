#!/bin/bash
# scripts/mount-nas.sh

set -e

# 環境変数読み込み
source ../nas-config.env

echo "🔗 NAS接続開始: ${NAS_HOST}/${NAS_SHARE}"

# マウントポイント作成
sudo mkdir -p ${NAS_MOUNT_POINT}

# 既存マウントをアンマウント（エラー無視）
sudo umount ${NAS_MOUNT_POINT} 2>/dev/null || true

# NASマウント実行
sudo mount -t cifs //${NAS_HOST}/${NAS_SHARE} ${NAS_MOUNT_POINT} \
  -o username=${NAS_USERNAME},password=${NAS_PASSWORD},uid=$(id -u),gid=$(id -g),file_mode=0755,dir_mode=0755

echo "✅ NASマウント完了: ${NAS_MOUNT_POINT}"
echo "📁 データパス: ${DATA_ROOT_PATH}"

# マウント確認
ls -la ${NAS_MOUNT_POINT} 