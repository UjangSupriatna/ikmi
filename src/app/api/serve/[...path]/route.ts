import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Serve uploaded files dynamically (works with standalone mode)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 })
    }

    // Build file path: /uploads/posts/filename.jpg -> public/uploads/posts/filename.jpg
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments)
    
    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!normalizedPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }

    // Check if file exists
    if (!existsSync(normalizedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(normalizedPath)
    const fileStats = await stat(normalizedPath)

    // Determine content type
    const ext = path.extname(normalizedPath).toLowerCase()
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.bmp': 'image/bmp',
    }
    const contentType = contentTypes[ext] || 'application/octet-stream'

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Last-Modified': fileStats.mtime.toUTCString(),
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
