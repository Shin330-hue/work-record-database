// 機械種別関連のユーティリティ関数

// 日本語の機械種別名を英語にマッピング
export const machineTypeMap: Record<string, string> = {
  'マシニング': 'machining',
  'ターニング': 'turning',
  '横中': 'yokonaka',
  'ラジアル': 'radial',
  'フライス': 'other',
  'その他': 'other'
}

// 英語から日本語へのマッピング
export const machineTypeMapReverse: Record<string, string> = {
  'machining': 'マシニング',
  'turning': 'ターニング',
  'yokonaka': '横中',
  'radial': 'ラジアル',
  'other': 'その他'
}

// 機械種別を英語に変換
export function getMachineTypeKey(japaneseType: string): string {
  return machineTypeMap[japaneseType] || 'other'
}

// 機械種別を日本語に変換
export function getMachineTypeJapanese(englishType: string): string {
  return machineTypeMapReverse[englishType] || 'その他'
}

// ステップフォルダ名を生成（機械種別付き）
export function getStepFolderName(stepNumber: number | string, machineType?: string): string {
  const stepNum = typeof stepNumber === 'string' ? stepNumber : stepNumber.toString()
  const paddedStep = stepNum.padStart(2, '0')
  
  if (machineType) {
    const machineKey = getMachineTypeKey(machineType)
    return `step_${paddedStep}_${machineKey}`
  }
  
  // 後方互換性のため、機械種別が指定されていない場合は従来の形式を返す
  return `step_${paddedStep}`
}

// フォルダ名から機械種別を抽出
export function extractMachineTypeFromFolder(folderName: string): string | null {
  const match = folderName.match(/step_\d+_(.+)/)
  return match ? match[1] : null
}

// 両方の形式のフォルダ名を試すヘルパー関数
export function getPossibleFolderNames(stepNumber: number | string, machineType?: string): string[] {
  const stepNum = typeof stepNumber === 'string' ? stepNumber : stepNumber.toString()
  const paddedStep = stepNum.padStart(2, '0')
  
  const folderNames = []
  
  // 新形式（機械種別付き）
  if (machineType) {
    const machineKey = getMachineTypeKey(machineType)
    folderNames.push(`step_${paddedStep}_${machineKey}`)
  }
  
  // 旧形式（後方互換性）
  folderNames.push(`step_${paddedStep}`)
  
  return folderNames
}