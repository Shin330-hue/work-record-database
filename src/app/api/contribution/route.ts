import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { ContributionData, ContributionFile } from '@/types/contribution'
import { sanitizeDrawingNumber } from '@/lib/dataLoader'

function generateId(): string {
  return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9)
}

function getContributionPath(drawingNumber: string): string {
  const safeDrawingNumber = sanitizeDrawingNumber(drawingNumber)
  if (process.env.NODE_ENV === 'production') {
    return path.join(process.env.DATA_ROOT_PATH || '/mnt/nas/project-data', 
                    'work-instructions', `drawing-${safeDrawingNumber}`, 'contributions')
  }
  return path.join(process.cwd(), 'public', 'data', 'work-instructions', 
                  `drawing-${safeDrawingNumber}`, 'contributions')
}

async function ensureContributionDirectory(contributionPath: string): Promise<void> {
  if (!existsSync(contributionPath)) {
    await mkdir(contributionPath, { recursive: true })
    await mkdir(path.join(contributionPath, 'files'), { recursive: true })
    await mkdir(path.join(contributionPath, 'files', 'images'), { recursive: true })
    await mkdir(path.join(contributionPath, 'files', 'videos'), { recursive: true })
  }
}

async function loadContributionFile(contributionPath: string): Promise<ContributionFile> {
  const filePath = path.join(contributionPath, 'contributions.json')
  try {
    if (existsSync(filePath)) {
      const data = await readFile(filePath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load contribution file:', error)
  }
  
  return {
    drawingNumber: '',
    contributions: [],
    metadata: {
      totalContributions: 0,
      lastUpdated: new Date().toISOString(),
      version: '1.0',
      mergedCount: 0
    }
  }
}

async function saveContributionFile(contributionPath: string, data: ContributionFile): Promise<void> {
  const filePath = path.join(contributionPath, 'contributions.json')
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const drawingNumber = formData.get('drawingNumber') as string
    const userId = formData.get('userId') as string
    const userName = formData.get('userName') as string
    const type = formData.get('type') as string
    const targetSection = formData.get('targetSection') as string
    const stepNumber = formData.get('stepNumber') as string
    const text = formData.get('text') as string
    const file = formData.get('file') as File | null

    if (!drawingNumber || !userId || !userName || !type || !targetSection) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const contributionPath = getContributionPath(drawingNumber)
    await ensureContributionDirectory(contributionPath)

    const contributionFile = await loadContributionFile(contributionPath)
    contributionFile.drawingNumber = drawingNumber

    const contributionId = generateId()
    let filePath: string | undefined

    if (file && file.size > 0) {
      const fileExtension = path.extname(file.name)
      const fileName = `${userId}_${contributionId}${fileExtension}`
      const fileType = file.type.startsWith('image/') ? 'images' : 'videos'
      const fullFilePath = path.join(contributionPath, 'files', fileType, fileName)
      
      const bytes = await file.arrayBuffer()
      await writeFile(fullFilePath, Buffer.from(bytes))
      filePath = `files/${fileType}/${fileName}`
    }

    const contribution: ContributionData = {
      id: contributionId,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      type: type as ContributionData['type'],
      targetSection: targetSection as ContributionData['targetSection'],
      stepNumber: stepNumber ? parseInt(stepNumber) : undefined,
      content: {
        text: text || undefined,
        imagePath: file?.type.startsWith('image/') ? filePath : undefined,
        videoPath: file?.type.startsWith('video/') ? filePath : undefined,
        originalFileName: file?.name,
        fileSize: file?.size
      },
      status: 'active'
    }

    contributionFile.contributions.push(contribution)
    contributionFile.metadata.totalContributions = contributionFile.contributions.length
    contributionFile.metadata.lastUpdated = new Date().toISOString()

    await saveContributionFile(contributionPath, contributionFile)

    return NextResponse.json({ success: true, contributionId })
  } catch (error) {
    console.error('Contribution submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const drawingNumber = searchParams.get('drawingNumber')

    if (!drawingNumber) {
      return NextResponse.json({ error: 'Drawing number required' }, { status: 400 })
    }

    const contributionPath = getContributionPath(drawingNumber)
    const contributionFile = await loadContributionFile(contributionPath)

    return NextResponse.json(contributionFile)
  } catch (error) {
    console.error('Contribution fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}