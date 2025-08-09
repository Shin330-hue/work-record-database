import shutil
from pathlib import Path

# 手順なし図番（空フォルダ削除のみ）
empty_drawings = [
    "drawing-4K300346",
    "drawing-4K470955",
    "drawing-4K524654-1",
    "drawing-4K524654-2",
    "drawing-82096-2-R04",
    "drawing-P103668"
]

base_path = Path("public/data/work-instructions")

print("Deleting empty step folders (Phase 2)...")
print("=" * 60)

total_deleted = 0

for drawing in empty_drawings:
    drawing_path = base_path / drawing
    deleted_count = 0
    
    if not drawing_path.exists():
        print(f"SKIP {drawing}: Folder does not exist")
        continue
    
    # 各メディアタイプのstepフォルダを削除
    for folder_type in ['images', 'videos', 'pdfs', 'programs']:
        folder_path = drawing_path / folder_type
        if folder_path.exists():
            step_dirs = list(folder_path.glob("step_*"))
            for step_dir in step_dirs:
                # overviewフォルダは削除しない
                if "overview" not in str(step_dir):
                    try:
                        # ファイルがあるか確認
                        files = list(step_dir.glob("*"))
                        if files:
                            print(f"  WARNING: {step_dir} has {len(files)} files - skipping")
                        else:
                            shutil.rmtree(step_dir)
                            deleted_count += 1
                    except Exception as e:
                        print(f"  ERROR deleting {step_dir}: {e}")
    
    if deleted_count > 0:
        print(f"DONE {drawing}: Deleted {deleted_count} step folders")
        total_deleted += deleted_count
    else:
        print(f"SKIP {drawing}: No step folders found")

print(f"\n" + "=" * 60)
print(f"Total: Deleted {total_deleted} step folders from {len(empty_drawings)} drawings")