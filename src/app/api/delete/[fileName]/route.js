import { unlink } from 'fs/promises'
import { NextResponse } from 'next/server'
import path from 'path'

export async function DELETE(request, { params }) {
  try {
    const { fileName } = params
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName)
    
    console.log(`Attempting to delete file: ${filePath}`)
    await unlink(filePath)
    
    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Error deleting file' }, { status: 500 })
  }
}
