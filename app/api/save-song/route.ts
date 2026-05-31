import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // your frontend sends: { songs: updatedData }
    const updatedData = body.songs

    if (!updatedData) {
      return Response.json({
        success: false,
        error: "No song data received",
      })
    }

    const base64 = Buffer.from(JSON.stringify(updatedData)).toString("base64")

    const upload = await cloudinary.uploader.upload(
      "data:application/json;base64," + base64,
      {
        resource_type: "raw",
        public_id: "songs",
        overwrite: true,
      }
    )

    return Response.json({
      success: true,
      url: upload.secure_url,
    })
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message,
    })
  }
}