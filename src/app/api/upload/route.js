import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request) {
  try {
    const data = await request.formData()
    const file = data.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Convert buffer to base64 for Cloudinary upload
    const base64Data = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64Data}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'photo-booth', // Organize uploads in a folder
      public_id: `photo-${Date.now()}`, // Unique filename
      resource_type: 'image',
      format: 'jpg', // Convert all images to JPG for consistency
      quality: 'auto', // Auto-optimize quality
      fetch_format: 'auto', // Auto-optimize format for browsers
    })

    return NextResponse.json({ 
      url: result.secure_url,
      fileName: result.public_id,
      cloudinaryId: result.public_id
    })
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error)
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 })
  }
}
