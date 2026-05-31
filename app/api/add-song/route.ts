import { readFileSync, writeFileSync } from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const filePath = path.join(process.cwd(), "public/songs.json")
    const data = JSON.parse(readFileSync(filePath, "utf-8"))

    const { file, action, newTitle, newLyrics } = body

    for (const folder of data) {
      if (folder.type === "nested") {
        for (const sub of folder.subfolders) {
          const song = sub.songs.find((s: any) => s.file === file)

          if (song) {
            if (action === "delete") {
              sub.songs = sub.songs.filter((s: any) => s.file !== file)
            }

            if (action === "edit") {
              if (newTitle !== undefined) song.title = newTitle
              if (newLyrics !== undefined) song.lyrics = newLyrics
            }
          }
        }
      } else {
        const song = folder.songs.find((s: any) => s.file === file)

        if (song) {
          if (action === "delete") {
            folder.songs = folder.songs.filter((s: any) => s.file !== file)
          }

          if (action === "edit") {
            if (newTitle !== undefined) song.title = newTitle
            if (newLyrics !== undefined) song.lyrics = newLyrics
          }
        }
      }
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2))

    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message,
    })
  }
}