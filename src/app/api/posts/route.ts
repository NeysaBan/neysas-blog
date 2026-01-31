import { NextResponse } from 'next/server'
import { getAllPosts, getAllCategories, searchPosts, getPostsByCategory } from '@/lib/markdown'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  
  try {
    let posts
    
    if (search) {
      posts = searchPosts(search)
    } else if (category && category !== '全部') {
      posts = getPostsByCategory(category)
    } else {
      posts = getAllPosts()
    }
    
    const categories = getAllCategories()
    
    return NextResponse.json({
      success: true,
      posts,
      categories,
      total: posts.length
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
