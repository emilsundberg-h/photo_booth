import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function DELETE(request, { params }) {
  try {
    const { fileName } = params
    
    console.log(`Attempting to delete Cloudinary asset: ${fileName}`)
    
    // Delete from Cloudinary using the public_id
    const result = await cloudinary.uploader.destroy(fileName)
    
    if (result.result === 'ok') {
      return NextResponse.json({ message: 'File deleted successfully' })
    } else {
      console.error('Cloudinary deletion failed:', result)
      return NextResponse.json({ error: 'File not found or already deleted' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error)
    return NextResponse.json({ error: 'Error deleting file' }, { status: 500 })
  }
}
