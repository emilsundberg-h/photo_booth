import { readdir } from 'fs/promises'
import { NextResponse } from 'next/server'
import path from 'path'

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const files = await readdir(uploadsDir)
    
    const photos = files
      .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
      .map(file => ({
        url: `/uploads/${file}`,
        fileName: file,
      }))

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error reading photos:', error)
    return NextResponse.json({ error: 'Error reading photos' }, { status: 500 })
  }
}
