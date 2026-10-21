import { v2 as cloudinary } from "cloudinary"
 
export const maxDuration = 60
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})
 
// Pulls the file id out of a Google Drive share link
function getDriveId(url: string) {
  const a = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (a) return a[1]
 
  const b = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (b) return b[1]
 
  return null
}
 
export async function POST(req: Request) {
  try {
    const { password, driveUrl, assetFolder, type } = await req.json()
 
    // Only the admin can use this
    if (
      !process.env.ADMIN_PASSWORD ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
 
    const folder = String(assetFolder || "")
      .replace(/[&?#%<>\\]/g, "")
      .replace(/\s*\/\s*/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .trim()
 
    if (!folder) {
      return Response.json(
        { success: false, error: "No folder selected" },
        { status: 400 }
      )
    }
 
    const id = getDriveId(String(driveUrl || ""))
 
    if (!id) {
      return Response.json(
        {
          success: false,
          error: "That does not look like a Google Drive file link",
        },
        { status: 400 }
      )
    }
 
    // Download the file from Google Drive
    const driveRes = await fetch(
      `https://drive.google.com/uc?export=download&id=${id}`,
      { redirect: "follow" }
    )
 
    if (!driveRes.ok) {
      return Response.json(
        { success: false, error: "Google Drive refused the download" },
        { status: 400 }
      )
    }
 
    const contentType = driveRes.headers.get("content-type") || ""
 
    // Drive sends a web page instead of the file when the link is private
    if (contentType.includes("text/html")) {
      return Response.json(
        {
          success: false,
          error:
            'Drive did not give the file. In Drive, set sharing to "Anyone with the link" and try again.',
        },
        { status: 400 }
      )
    }
 
    // Try to keep the original file name
    const disposition = driveRes.headers.get("content-disposition") || ""
    let filename = ""
 
    const star = disposition.match(/filename\*=UTF-8''([^;]+)/i)
    const plain = disposition.match(/filename="([^"]+)"/i)
 
    if (star) {
      try {
        filename = decodeURIComponent(star[1])
      } catch {
        filename = star[1]
      }
    } else if (plain) {
      filename = plain[1]
    }
 
    const buffer = Buffer.from(await driveRes.arrayBuffer())
 
    if (buffer.length > 80 * 1024 * 1024) {
      return Response.json(
        {
          success: false,
          error: "File is too big to import. Use the file picker instead.",
        },
        { status: 400 }
      )
    }
 
    // Upload it to Cloudinary, inside the chosen folder
    const options: any = {
      resource_type: type === "audio" ? "video" : "raw",
      asset_folder: folder,
      use_filename: true,
      unique_filename: true,
    }
 
    if (filename) options.filename_override = filename
 
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (err: any, r: any) => (err ? reject(err) : resolve(r))
      )
      stream.end(buffer)
    })
 
    return Response.json({
      success: true,
      url: result.secure_url,
      filename,
    })
  } catch (err: any) {
    return Response.json(
      { success: false, error: err?.message || "Import failed" },
      { status: 500 }
    )
  }
}
