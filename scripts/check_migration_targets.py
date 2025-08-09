import json
import os
from pathlib import Path

# 移行対象候補の図番リスト（0D127100014は完了済み）
target_drawings = [
    "drawing-82096-2-R04",
    "drawing-flange_sus_sanei_20250722",
    "drawing-A1-46717-E",
    "drawing-0F030800622",
    "drawing-12750800122",
    "drawing-16800301576",
    "drawing-1G-162-TL-05",
    "drawing-24K025_20252725",
    "drawing-25417362721",
    "drawing-DM-05",
    "drawing-sanei_24K022",
    # 念のため他の図番も確認
    "drawing-4K300346",
    "drawing-4K470955",
    "drawing-4K524654-1",
    "drawing-4K524654-2",
    "drawing-91260506-2",
    "drawing-P103668"
]

base_path = Path("public/data/work-instructions")

print("=" * 60)
print("Migration targets analysis")
print("=" * 60)

total_files = 0
drawings_with_data = []

for drawing in target_drawings:
    drawing_path = base_path / drawing
    
    if not drawing_path.exists():
        continue
    
    # instruction.jsonを確認
    instruction_file = drawing_path / "instruction.json"
    if not instruction_file.exists():
        continue
        
    with open(instruction_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # workStepsByMachineを確認
    machine_steps = {}
    if 'workStepsByMachine' in data:
        for machine_type in ['machining', 'turning', 'yokonaka', 'radial', 'other']:
            if machine_type in data['workStepsByMachine'] and len(data['workStepsByMachine'][machine_type]) > 0:
                machine_steps[machine_type] = len(data['workStepsByMachine'][machine_type])
    
    # 旧形式のworkStepsも確認
    if 'workSteps' in data and len(data['workSteps']) > 0:
        machine_steps['legacy'] = len(data['workSteps'])
    
    if not machine_steps:
        continue
    
    # 実ファイルをカウント
    file_count = 0
    step_folders_info = []
    
    for folder_type in ['images', 'videos', 'pdfs', 'programs']:
        folder_path = drawing_path / folder_type
        if folder_path.exists():
            for step_dir in folder_path.glob("step_*"):
                if "overview" not in str(step_dir) and "_machining" not in str(step_dir) and "_turning" not in str(step_dir):
                    files = list(step_dir.glob("*"))
                    if files:
                        file_count += len(files)
                        step_folders_info.append(f"{folder_type}/{step_dir.name}: {len(files)} files")
    
    if file_count > 0 or machine_steps:
        print(f"\n{drawing}")
        print("-" * 40)
        print(f"Work steps: {machine_steps}")
        if file_count > 0:
            print(f"Total files: {file_count}")
            for info in step_folders_info:
                print(f"  - {info}")
            total_files += file_count
            drawings_with_data.append(drawing)
        else:
            print("  No files in step folders")

print("\n" + "=" * 60)
print(f"Summary:")
print(f"  Drawings with data: {len(drawings_with_data)}")
print(f"  Total files to migrate: {total_files}")
print(f"\nDrawings to migrate:")
for d in drawings_with_data:
    print(f"  - {d}")