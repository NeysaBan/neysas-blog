import { NextResponse } from 'next/server'
import { getPostViews, incrementPostViews } from '@/lib/views'

// GET - 获取文章浏览量
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const views = getPostViews(slug)
    
    return NextResponse.json({
      success: true,
      views
    })
  } catch (error) {
    console.error('Error getting views:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get views' },
      { status: 500 }
    )
  }
}

// POST - 增加文章浏览量
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const views = incrementPostViews(slug)
    
    return NextResponse.json({
      success: true,
      views
    })
  } catch (error) {
    console.error('Error incrementing views:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to increment views' },
      { status: 500 }
    )
  }
}
