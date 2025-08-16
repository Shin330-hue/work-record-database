'use client'

import { Dispatch, SetStateAction } from 'react'
import { WorkStep, NearMissItem } from '@/lib/dataLoader'

// フォームデータの型定義
interface EditFormData {
  drawingNumber: string
  title: string
  company: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    category: string
  }
  difficulty: '初級' | '中級' | '上級'
  estimatedTime: string
  machineType: string[]
  description: string
  keywords: string[]
  toolsRequired: string[]
  overview: {
    description: string
    warnings: string[]
    preparationTime: string
    processingTime: string
  }
  workSteps: WorkStep[]
  workStepsByMachine?: {
    machining?: WorkStep[]
    turning?: WorkStep[]
    yokonaka?: WorkStep[]
    radial?: WorkStep[]
    other?: WorkStep[]
  }
  nearMiss: NearMissItem[]
  relatedDrawings: Array<{
    drawingNumber: string
    relation: string
    description: string
  }>
}

// 共通ハンドラーのカスタムフック
export const useEditFormHandlers = (
  formData: EditFormData | null,
  setFormData: Dispatch<SetStateAction<EditFormData | null>>
) => {
  
  // 基本情報更新ハンドラー
  const handleMachineTypeChange = (machine: string, checked: boolean) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      
      const newMachineTypes = checked
        ? [...prev.machineType, machine]
        : prev.machineType.filter(m => m !== machine)

      return {
        ...prev,
        machineType: newMachineTypes
      }
    })
  }

  const handleKeywordsChange = (keywordsString: string) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        keywords: keywordsString.split(',').map(k => k.trim()).filter(k => k)
      }
    })
  }

  const handleToolsRequiredChange = (toolsString: string) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        toolsRequired: toolsString.split(',').map(t => t.trim()).filter(t => t)
      }
    })
  }

  // 警告事項の配列操作ハンドラー
  const handleWarningChange = (index: number, value: string) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newWarnings = [...prev.overview.warnings]
      newWarnings[index] = value
      return {
        ...prev,
        overview: { ...prev.overview, warnings: newWarnings }
      }
    })
  }

  const addWarning = () => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        overview: { ...prev.overview, warnings: [...prev.overview.warnings, ''] }
      }
    })
  }

  const removeWarning = (index: number) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newWarnings = prev.overview.warnings.filter((_, i) => i !== index)
      return {
        ...prev,
        overview: { ...prev.overview, warnings: newWarnings }
      }
    })
  }

  // 作業ステップ操作ハンドラー
  const addWorkStep = (machineType?: 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other') => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev

      const newStep: WorkStep = {
        stepNumber: 1,
        title: '',
        description: '',
        detailedInstructions: [''],
        timeRequired: '',
        warningLevel: 'normal',
        tools: [],
        notes: []
      }

      if (machineType && prev.workStepsByMachine) {
        const currentSteps = prev.workStepsByMachine[machineType] || []
        newStep.stepNumber = currentSteps.length + 1
        
        return {
          ...prev,
          workStepsByMachine: {
            ...prev.workStepsByMachine,
            [machineType]: [...currentSteps, newStep]
          }
        }
      } else {
        newStep.stepNumber = prev.workSteps.length + 1
        return {
          ...prev,
          workSteps: [...prev.workSteps, newStep]
        }
      }
    })
  }

  const updateWorkStep = (index: number, updatedStep: WorkStep, machineType?: 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other') => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev

      if (machineType && prev.workStepsByMachine) {
        const currentSteps = [...(prev.workStepsByMachine[machineType] || [])]
        currentSteps[index] = updatedStep
        
        return {
          ...prev,
          workStepsByMachine: {
            ...prev.workStepsByMachine,
            [machineType]: currentSteps
          }
        }
      } else {
        const newSteps = [...prev.workSteps]
        newSteps[index] = updatedStep
        return {
          ...prev,
          workSteps: newSteps
        }
      }
    })
  }

  const deleteWorkStep = (index: number, machineType?: 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other') => {
    if (!formData) return
    
    setFormData(prev => {
      if (!prev) return prev

      if (machineType && prev.workStepsByMachine) {
        const currentSteps = [...(prev.workStepsByMachine[machineType] || [])]
        currentSteps.splice(index, 1)
        
        // ステップ番号を再調整
        const renumberedSteps = currentSteps.map((step, i) => ({
          ...step,
          stepNumber: i + 1
        }))
        
        return {
          ...prev,
          workStepsByMachine: {
            ...prev.workStepsByMachine,
            [machineType]: renumberedSteps
          }
        }
      } else {
        const newSteps = [...prev.workSteps]
        newSteps.splice(index, 1)
        
        // ステップ番号を再調整
        const renumberedSteps = newSteps.map((step, i) => ({
          ...step,
          stepNumber: i + 1
        }))
        
        return {
          ...prev,
          workSteps: renumberedSteps
        }
      }
    })
  }

  const moveWorkStep = (fromIndex: number, toIndex: number, machineType?: 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other') => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev

      if (machineType && prev.workStepsByMachine) {
        const currentSteps = [...(prev.workStepsByMachine[machineType] || [])]
        const [movedStep] = currentSteps.splice(fromIndex, 1)
        currentSteps.splice(toIndex, 0, movedStep)
        
        // ステップ番号を再調整
        const renumberedSteps = currentSteps.map((step, i) => ({
          ...step,
          stepNumber: i + 1
        }))
        
        return {
          ...prev,
          workStepsByMachine: {
            ...prev.workStepsByMachine,
            [machineType]: renumberedSteps
          }
        }
      } else {
        const newSteps = [...prev.workSteps]
        const [movedStep] = newSteps.splice(fromIndex, 1)
        newSteps.splice(toIndex, 0, movedStep)
        
        // ステップ番号を再調整
        const renumberedSteps = newSteps.map((step, i) => ({
          ...step,
          stepNumber: i + 1
        }))
        
        return {
          ...prev,
          workSteps: renumberedSteps
        }
      }
    })
  }

  // ヒヤリハット事例操作ハンドラー
  const handleNearMissChange = (index: number, field: keyof NearMissItem, value: string) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newNearMiss = [...prev.nearMiss]
      newNearMiss[index] = { ...newNearMiss[index], [field]: value }
      return {
        ...prev,
        nearMiss: newNearMiss
      }
    })
  }

  const addNearMiss = () => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newItem: NearMissItem = {
        title: '',
        description: '',
        cause: '',
        prevention: '',
        severity: 'low'
      }
      return {
        ...prev,
        nearMiss: [...prev.nearMiss, newItem]
      }
    })
  }

  const removeNearMiss = (index: number) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newNearMiss = prev.nearMiss.filter((_, i) => i !== index)
      return {
        ...prev,
        nearMiss: newNearMiss
      }
    })
  }

  return {
    // 基本情報ハンドラー
    handleMachineTypeChange,
    handleKeywordsChange,
    handleToolsRequiredChange,
    
    // 警告事項ハンドラー
    handleWarningChange,
    addWarning,
    removeWarning,
    
    // 作業ステップハンドラー
    addWorkStep,
    updateWorkStep,
    deleteWorkStep,
    moveWorkStep,
    
    // ヒヤリハット事例ハンドラー
    handleNearMissChange,
    addNearMiss,
    removeNearMiss
  }
}