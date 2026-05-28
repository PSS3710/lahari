import { readFileSync, writeFileSync } from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const filePath = path.join(process.cwd(), "public/songs.json")

    // read existing data safely
    const rawData = readFileSync(filePath, "utf-8")
    const data = JSON.parse(rawData)

    const newSong = {
      title: body.title,
      file: body.file,
      lyrics: body.lyrics,
      folder: body.folder,
      subfolder: body.subfolder || "",
    }

    // find folder
    const folderIndex = data.findIndex(
      (f: any) => f.folder === body.folder
    )

    if (folderIndex === -1) {
      return Response.json({
        success: false,
        error: "Folder not found",
      })
    }

    const folder = data[folderIndex]

    // nested folder logic
    if (folder.type === "nested") {
      const sub = folder.subfolders.find(
        (s: any) => s.name === body.subfolder
      )

      if (!sub) {
        return Response.json({
          success: false,
          error: "Subfolder not found",
        })
      }

      sub.songs.push(newSong)
    } else {
      // flat folder logic
      folder.songs.push(newSong)
    }

    // write updated file
    writeFileSync(filePath, JSON.stringify(data, null, 2))

    return Response.json({ success: true })
  } catch (err: any) {
    console.log("API ERROR:", err)

    return Response.json({
      success: false,
      error: err?.message || "Something went wrong",
    })
  }
}