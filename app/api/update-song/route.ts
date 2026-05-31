import { v2 as cloudinary } from "cloudinary"
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

export async function POST(req: Request) {
  const body = await req.json()

  const { updatedData } = body

  try {
    const upload = await cloudinary.uploader.upload(
      "data:application/json;base64," +
        Buffer.from(JSON.stringify(updatedData)).toString("base64"),
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