// src/lib/dataLoader.ts を以下に完全置き換え
export interface Advice {
  title: string
  text: string
  icon: string
  items?: { title: string; description: string }[]
  image?: string
  video?: string
}

export interface AdviceNode {
  id: string
  label: string
  icon: string
  description?: string
  category?: string
  children?: AdviceNode[]
  advice?: Advice
}

export interface MainCategory {
  id: string
  label: string
  icon: string
  description: string
  priority: number
}

export interface OtherCategory {
  id: string
  label: string
  icon: string
  description: string
}

export interface AdviceData {
  mainCategories: MainCategory[]
  otherCategory: OtherCategory
  problems: AdviceNode[]
}

export const loadAdviceData = async (): Promise<AdviceData> => {
  const mainCategories: MainCategory[] = [
    { 
      id: 'surface',        // ← 修正済み
      label: '表面仕上げ', 
      icon: '😵', 
      description: '仕上げ面の粗さや品質に関する問題',
      priority: 1 
    },
    { 
      id: 'tool',          // ← 修正済み
      label: '工具関連', 
      icon: '🔨', 
      description: '切削工具の摩耗や破損に関する問題',
      priority: 2 
    },
    { 
      id: 'dimension',     // ← 修正済み
      label: '寸法精度', 
      icon: '📏', 
      description: '寸法のばらつきや精度に関する問題',
      priority: 3 
    },
    { 
      id: 'material',      // ← 修正済み
      label: '材料問題', 
      icon: '🔊', 
      description: '材料の性質や加工性に関する問題',
      priority: 4 
    }
  ]

  const otherCategory: OtherCategory = {
    id: 'others',
    label: 'その他',
    icon: '📋',
    description: '上記以外の加工に関する問題'
  }

  const problems: AdviceNode[] = [
    // 🔥 表面仕上げ関連
    {
      id: 'surface-dirty',
      label: '加工面が汚い',
      category: 'surface',
      icon: '😤',
      children: [
        {
          id: 'surface-rough',
          label: 'ザラザラしている',
          icon: '🧱',
          description: '表面が粗い',
          advice: {
            title: '送りマーク改善策',
            text: '送り速度の調整と工具選定により送りマークを改善できます。',
            icon: '💡',
            image: 'surface_bad.jpg', // 🔥 実際のファイル名に修正
            video: 'surface_bad.mp4', // 🔥 実際のファイル名に修正
            items: [
              { title: '送り速度を下げる', description: '現在の50%程度に下げて様子を見る' },
              { title: '工具の刃先を確認', description: '摩耗していたら交換する' },
              { title: 'クーラントを多めにかける', description: '切削熱を下げる' }
            ]
          }
        },
        {
          id: 'surface-shiny',
          label: 'テカテカしている',
          icon: '✨',
          description: '異常な光沢',
          advice: {
            title: '光沢異常の対策',
            text: '工具摩耗による圧延効果が原因です。工具交換で解決します。',
            icon: '🔧',
            // 画像・動画がない場合は省略
            items: [
              { title: '工具を新品に交換', description: '摩耗した工具は即座に交換' },
              { title: '切削速度を下げる', description: '摩耗を遅らせる' },
              { title: '工具材質の見直し', description: 'より硬い材質を検討' }
            ]
          }
        },
        {
          id: 'surface-burr',
          label: 'バリが出る',
          icon: '🌵',
          description: 'エッジ処理不良',
          advice: {
            title: 'バリ除去対策',
            text: '適切な工具角度と送り条件でバリの発生を抑制できます。',
            icon: '🎯',
            items: [
              { title: '工具角度の調整', description: 'リード角を小さくする' },
              { title: '送り速度の最適化', description: '材料に応じた適正送り' },
              { title: 'エッジブレーカー使用', description: 'バリ発生を抑制する工具' }
            ]
          }
        }
      ]
    },

    // 🔥 工具関連
    {
      id: 'tool-life',
      label: '工具寿命が短い',
      category: 'tool',
      icon: '⚡',
      children: [
        {
          id: 'tool-wear-fast',
          label: 'すぐに摩耗する',
          icon: '📉',
          description: '工具摩耗が早い',
          advice: {
            title: '工具摩耗対策',
            text: '切削条件の最適化により工具寿命を延ばせます。',
            icon: '🛠️',
            image: 'tool_broken.jpg', // 🔥 実際のファイル名
            video: 'tool_broken.mp4', // 🔥 実際のファイル名
            items: [
              { title: '切削速度を下げる', description: '推奨値の80%から開始' },
              { title: 'クーラント量を増やす', description: '切削熱を効果的に除去' },
              { title: '工具材質の変更', description: 'より耐摩耗性の高い材質へ' }
            ]
          }
        }
      ]
    },

    // 🔥 他のカテゴリは画像・動画なしで作成
    {
      id: 'dimension-variation',
      label: '寸法がばらつく',
      category: 'dimension',
      icon: '📐',
      children: [
        {
          id: 'dimension-unstable',
          label: '寸法が安定しない',
          icon: '📊',
          description: '加工精度のばらつき',
          advice: {
            title: '寸法安定化対策',
            text: '機械剛性と工具保持の改善により寸法精度を向上できます。',
            icon: '🎯',
            items: [
              { title: '工具の突き出し短縮', description: 'たわみを最小限に抑制' },
              { title: 'クランプ力の調整', description: 'ワークの変形を防止' },
              { title: '温度管理の改善', description: '熱変形の影響を軽減' }
            ]
          }
        }
      ]
    },

    {
      id: 'material-hardness',
      label: '材料が硬すぎる',
      category: 'material',
      icon: '💎',
      children: [
        {
          id: 'material-difficult',
          label: '加工が困難',
          icon: '😫',
          description: '難削材への対応',
          advice: {
            title: '難削材加工対策',
            text: '適切な工具選定と切削条件により難削材も効率的に加工できます。',
            icon: '💪',
            items: [
              { title: '超硬工具の使用', description: 'CBNやセラミック工具を検討' },
              { title: '低速高送り', description: '切削熱を抑制する条件設定' },
              { title: '十分なクーラント', description: '大量のクーラントで冷却' }
            ]
          }
        }
      ]
    },

    {
      id: 'vibration',
      label: '振動が発生する',
      category: 'others',
      icon: '🌊',
      children: [
        {
          id: 'vibration-machine',
          label: '機械が振動する',
          icon: '📳',
          description: '機械振動の問題',
          advice: {
            title: '振動対策',
            text: '適切な切削条件と工具選定により振動を抑制できます。',
            icon: '🔧',
            items: [
              { title: '回転数の調整', description: '共振周波数を避ける' },
              { title: '工具剛性の向上', description: 'より太い工具を使用' },
              { title: 'ダンパーの設置', description: '振動吸収装置の追加' }
            ]
          }
        }
      ]
    },

    {
      id: 'noise',
      label: '異音がする',
      category: 'others',
      icon: '🔊',
      children: [
        {
          id: 'noise-cutting',
          label: '切削音が異常',
          icon: '🎵',
          description: '切削時の異音',
          advice: {
            title: '異音対策',
            text: '切削条件の見直しにより異音を改善できます。',
            icon: '🎼',
            items: [
              { title: '切削速度の調整', description: '最適な切削速度に変更' },
              { title: '工具状態の確認', description: '刃先の欠けや摩耗をチェック' },
              { title: 'クーラント見直し', description: '適切な潤滑状態を確保' }
            ]
          }
        }
      ]
    }
  ]

  return {
    mainCategories,
    otherCategory,
    problems
  }
}