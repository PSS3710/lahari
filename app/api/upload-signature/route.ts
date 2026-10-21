import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

export async function POST(req: Request) {
  try {
    const { password, assetFolder } = await req.json()

    if (!process.env.ADMIN_PASSWORD ||
        password !== process.env.ADMIN_PASSWORD) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (
      typeof assetFolder !== "string" ||
      !assetFolder.trim() ||
      assetFolder.length > 500
    ) {
      return Response.json(
        { success: false, error: "Invalid folder" },
        { status: 400 }
      )
    }

    const timestamp = Math.floor(Date.now() / 1000)

    const params = {
      timestamp,
      asset_folder: assetFolder,
      use_filename: true,
      unique_filename: true,
    }

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_SECRET!
    )

    return Response.json({
      success: true,
      cloudName: process.env.CLOUDINARY_NAME,
      apiKey: process.env.CLOUDINARY_KEY,
      timestamp,
      assetFolder,
      signature,
    })
  } catch {
    return Response.json(
      { success: false, error: "Could not create upload signature" },
      { status: 500 }
    )
  }
}