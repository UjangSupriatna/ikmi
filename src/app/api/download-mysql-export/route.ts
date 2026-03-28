import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'db', 'mysql-export-full.sql')
    const fileContent = await readFile(filePath, 'utf-8')
    
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': 'attachment; filename="ikmi-social-mysql-export.sql"',
        'Content-Length': fileContent.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error reading export file:', error)
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  }
}
