import json
from pathlib import Path

# 最初に洗い出した旧形式フォルダを持つ全図番（40件）
all_old_format = [
    "drawing-02760810650",  # Phase1で削除済み
    "drawing-04297711725",  # Phase1で削除済み
    "drawing-05389730954",  # Phase1で削除済み
    "drawing-06190300668",  # Phase1で削除済み
    "drawing-06200301496",  # Phase1で削除済み
    "drawing-0974122270",   # Phase1で削除済み
    "drawing-0A149002911",  # Phase1で削除済み
    "drawing-0A224000531",  # Phase1で削除済み
    "drawing-0A229001290",  # Phase1で削除済み
    "drawing-0D127100014",  # ✅ 移行済み
    "drawing-0E260800172",  # Phase1で削除済み
    "drawing-0E260800190",  # Phase1で削除済み
    "drawing-0F030800622",  # 移行予定
    "drawing-12750800122",  # 移行予定
    "drawing-16800301576",  # 移行予定
    "drawing-1G-162-TL-05", # 移行予定
    "drawing-24K025_20252725", # 移行予定
    "drawing-25417362721",  # 移行予定
    "drawing-25417362731",  # Phase1で削除済み
    "drawing-4K300346",     # ?
    "drawing-4K470955",     # ?
    "drawing-4K524654-1",   # ?
    "drawing-4K524654-2",   # ?
    "drawing-5427365400",   # Phase1で削除済み
    "drawing-82096-2-R04",  # ?
    "drawing-91260506-2",   # 移行予定
    "drawing-A3159-500-00-A1", # Phase1で削除済み
    "drawing-DM-05",        # 移行予定
    "drawing-flange_sus_sanei_20250722", # ✅ 移行済み
    "drawing-GSETJIG-3101", # Phase1で削除済み
    "drawing-INNSJ-XXXX",   # Phase1で削除済み
    "drawing-M-2009211-060", # Phase1で削除済み
    "drawing-M-5329619-160", # Phase1で削除済み
    "drawing-P103668",      # 手順削除（要確認）
    "drawing-sanei_24K022", # 移行予定
    "drawing-TM2404599-1601-0", # Phase1で削除済み
    "drawing-TM2404599-1603-0", # Phase1で削除済み
    "drawing-TM2404599-1604-0", # Phase1で削除済み
    "drawing-TM2404599-1651-0", # Phase1で削除済み
    "drawing-TMT1750-P0003", # Phase1で削除済み
]

# カテゴリ分け
phase1_deleted = [
    "drawing-02760810650", "drawing-04297711725", "drawing-05389730954",
    "drawing-06190300668", "drawing-06200301496", "drawing-0974122270",
    "drawing-0A149002911", "drawing-0A224000531", "drawing-0A229001290",
    "drawing-0E260800172", "drawing-0E260800190", "drawing-25417362731",
    "drawing-5427365400", "drawing-A3159-500-00-A1", "drawing-GSETJIG-3101",
    "drawing-INNSJ-XXXX", "drawing-M-2009211-060", "drawing-M-5329619-160",
    "drawing-TM2404599-1601-0", "drawing-TM2404599-1603-0",
    "drawing-TM2404599-1604-0", "drawing-TM2404599-1651-0", "drawing-TMT1750-P0003"
]

migrated = [
    "drawing-0D127100014",
    "drawing-flange_sus_sanei_20250722"
]

to_migrate = [
    "drawing-0F030800622", "drawing-12750800122", "drawing-16800301576",
    "drawing-1G-162-TL-05", "drawing-24K025_20252725", "drawing-25417362721",
    "drawing-DM-05", "drawing-sanei_24K022", "drawing-91260506-2"
]

# 不明なものを特定
unknown = []
for d in all_old_format:
    if d not in phase1_deleted and d not in migrated and d not in to_migrate:
        unknown.append(d)

# 各図番の現状を確認
base_path = Path("public/data/work-instructions")

print("=" * 60)
print("Migration Status Check")
print("=" * 60)
print(f"\n総計: {len(all_old_format)}件")
print(f"  Phase1削除済み: {len(phase1_deleted)}件")
print(f"  移行済み: {len(migrated)}件")
print(f"  移行予定: {len(to_migrate)}件")
print(f"  未確認: {len(unknown)}件")

if unknown:
    print(f"\n未確認の図番:")
    for d in unknown:
        drawing_path = base_path / d
        status = ""
        
        if drawing_path.exists():
            # instruction.jsonを確認
            inst_file = drawing_path / "instruction.json"
            if inst_file.exists():
                with open(inst_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # workStepsByMachineを確認
                has_steps = False
                if 'workStepsByMachine' in data:
                    for machine in ['machining', 'turning', 'yokonaka', 'radial', 'other']:
                        if machine in data['workStepsByMachine'] and len(data['workStepsByMachine'][machine]) > 0:
                            has_steps = True
                            status += f"{machine}:{len(data['workStepsByMachine'][machine])} "
                
                if not has_steps:
                    status = "作業手順なし"
            
            # 旧形式フォルダを確認
            old_folders = []
            for folder_type in ['images', 'videos', 'pdfs', 'programs']:
                folder_path = drawing_path / folder_type
                if folder_path.exists():
                    for step_dir in folder_path.glob("step_[0-9]*"):
                        old_folders.append(f"{folder_type}/{step_dir.name}")
            
            if old_folders:
                status += f" | 旧フォルダ: {len(old_folders)}"
            
        else:
            status = "フォルダなし"
        
        print(f"  - {d}: {status}")

print("\n合計チェック:")
total = len(phase1_deleted) + len(migrated) + len(to_migrate) + len(unknown)
print(f"  {len(phase1_deleted)} + {len(migrated)} + {len(to_migrate)} + {len(unknown)} = {total}")
print(f"  元の総数: {len(all_old_format)}")
print(f"  {'✅ 一致' if total == len(all_old_format) else '❌ 不一致'}")