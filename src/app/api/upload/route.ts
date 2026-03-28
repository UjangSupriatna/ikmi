import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir, access, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// POST - Upload image file
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse formData
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formError) {
      console.error('Error parsing form data:', formError)
      return NextResponse.json(
        { error: 'Failed to parse form data. Request body might be too large.' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null
    const type = formData.get('type') as string || 'posts' // posts, profiles, events, groups

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB for better hosting compatibility)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${type.slice(0, -1)}-${timestamp}-${randomString}.${extension}`

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type)
    
    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
        console.log(`Created upload directory: ${uploadDir}`)
      }
      
      // Verify directory is writable
      await access(uploadDir, 2) // Check write permission
    } catch (dirError) {
      console.error('Directory error:', dirError)
      return NextResponse.json(
        { error: 'Upload directory is not writable. Please contact administrator.' },
        { status: 500 }
      )
    }

    // Write file
    let buffer: Buffer
    try {
      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)
    } catch (bufferError) {
      console.error('Buffer error:', bufferError)
      return NextResponse.json(
        { error: 'Failed to process file data' },
        { status: 500 }
      )
    }

    const filePath = path.join(uploadDir, fileName)
    
    try {
      await writeFile(filePath, buffer)
      console.log(`File saved successfully: ${filePath}`)
    } catch (writeError) {
      console.error('Write error:', writeError)
      return NextResponse.json(
        { error: 'Failed to save file to disk' },
        { status: 500 }
      )
    }

    // Verify file actually exists and has content
    try {
      const fileStats = await stat(filePath)
      if (fileStats.size === 0) {
        console.error('File is empty after write')
        return NextResponse.json(
          { error: 'File saved but is empty' },
          { status: 500 }
        )
      }
      console.log(`File verified: ${filePath} (${fileStats.size} bytes)`)
    } catch (verifyError) {
      console.error('File verification failed:', verifyError)
      return NextResponse.json(
        { error: 'File verification failed - file may not have been saved' },
        { status: 500 }
      )
    }

    // Return the public URL path via API serve (works with standalone mode)
    const publicPath = `/api/serve/${type}/${fileName}`

    return NextResponse.json({
      success: true,
      path: publicPath,
      fileName,
      size: buffer.length,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
