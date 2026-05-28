import { readFileSync, writeFileSync } from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const filePath = path.join(process.cwd(), "public/songs.json")
    const data = JSON.parse(readFileSync(filePath, "utf-8"))

    const { file, action, newTitle, newLyrics } = body

    if (!file || !action) {
      return Response.json({
        success: false,
        error: "Missing file or action",
      })
    }

    for (const folder of data) {
      if (folder.type === "nested") {
        for (const sub of folder.subfolders) {
          const songIndex = sub.songs.findIndex(
            (s: any) => s.file === file
          )

          if (songIndex !== -1) {
            if (action === "delete") {
              sub.songs.splice(songIndex, 1)
            }

            if (action === "edit") {
              if (newTitle !== undefined) {
                sub.songs[songIndex].title = newTitle
              }

              if (newLyrics !== undefined) {
                sub.songs[songIndex].lyrics = newLyrics
              }
            }
          }
        }
      } else {
        const songIndex = folder.songs.findIndex(
          (s: any) => s.file === file
        )

        if (songIndex !== -1) {
          if (action === "delete") {
            folder.songs.splice(songIndex, 1)
          }

          if (action === "edit") {
            if (newTitle !== undefined) {
              folder.songs[songIndex].title = newTitle
            }

            if (newLyrics !== undefined) {
              folder.songs[songIndex].lyrics = newLyrics
            }
          }
        }
      }
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2))

    return Response.json({
      success: true,
    })
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message || "Server error",
    })
  }
}