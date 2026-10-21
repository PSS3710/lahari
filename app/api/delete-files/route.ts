import { v2 as cloudinary } from "cloudinary"
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})
 
// Turns a Cloudinary file link into its type and public id
function parseUrl(url: string) {
  const m = url.match(
    /^https:\/\/res\.cloudinary\.com\/([^/]+)\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/
  )
  if (!m) return null
 
  const cloud = m[1]
  const type = m[2]
  let id = m[3].split("?")[0]
 
  try {
    id = decodeURIComponent(id)
  } catch {
    // keep the id as it is
  }
 
  // Audio and images do not keep the file ending in their id, raw files do
  if (type !== "raw") {
    id = id.replace(/\.[A-Za-z0-9]{2,5}$/, "")
  }
 
  return { cloud, type, id }
}
 
export async function POST(req: Request) {
  try {
    const { password, urls } = await req.json()
 
    // Only the admin can delete files
    if (
      !process.env.ADMIN_PASSWORD ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
 
    if (!Array.isArray(urls) || urls.length === 0 || urls.length > 20) {
      return Response.json(
        { success: false, error: "Invalid list of files" },
        { status: 400 }
      )
    }
 
    const groups: Record<string, string[]> = {}
    let skipped = 0
 
    for (const u of urls) {
      const parsed = typeof u === "string" ? parseUrl(u) : null
 
      // Skip anything from another account, and never touch the song list
      if (
        !parsed ||
        parsed.cloud !== process.env.CLOUDINARY_NAME ||
        parsed.id.startsWith("songs_zdzvpz")
      ) {
        skipped += 1
        continue
      }
 
      const list = groups[parsed.type] || []
      list.push(parsed.id)
      groups[parsed.type] = list
    }
 
    let deleted = 0
 
    for (const type of Object.keys(groups)) {
      const options: any = {
        resource_type: type,
        type: "upload",
        invalidate: true,
      }
 
      const result: any = await cloudinary.api.delete_resources(
        groups[type],
        options
      )
 
      const outcome = result?.deleted || {}
 
      for (const key of Object.keys(outcome)) {
        if (outcome[key] === "deleted") deleted += 1
      }
    }
 
    return Response.json({ success: true, deleted, skipped })
  } catch (err: any) {
    return Response.json(
      { success: false, error: err?.message || "Could not delete files" },
      { status: 500 }
    )
  }
}
 