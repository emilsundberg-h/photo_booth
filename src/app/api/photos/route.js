import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET() {
  try {
    // Get all images from the photo-booth folder in Cloudinary
    const result = await cloudinary.search
      .expression('folder:photo-booth AND resource_type:image')
      .max_results(100) // Limit to 100 photos
      .execute()

    // Handle case when no photos exist yet
    const photos = (result.resources || []).map(resource => ({
      url: resource.secure_url,
      fileName: resource.public_id,
      cloudinaryId: resource.public_id,
      createdAt: resource.created_at
    }))

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error fetching photos from Cloudinary:', error)
    return NextResponse.json({ error: 'Error reading photos' }, { status: 500 })
  }
}
