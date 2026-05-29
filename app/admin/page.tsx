"use client"

import { useEffect, useState } from "react"

const CLOUD_URL =
  "https://res.cloudinary.com/dsvwf5ywy/raw/upload/v1780027280/songs_gxdsdg.json"

export default function AdminPage() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState("")

  const [password, setPassword] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [title, setTitle] = useState("")
  const [file, setFile] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [folder, setFolder] = useState("")
  const [subfolder, setSubfolder] = useState("")

  const [editSong, setEditSong] = useState<any>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editLyrics, setEditLyrics] = useState("")

  // LOAD DATA
  useEffect(() => {
    fetch(CLOUD_URL)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.log(err))
  }, [])

  // SAVE TO CLOUDINARY (via API)
  const saveToCloud = async (updatedData: any) => {
    const res = await fetch("/api/save-songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs: updatedData }),
    })

    const result = await res.json()

    if (result.success) {
      alert("Saved successfully")
    } else {
      alert("Save failed")
    }
  }

  // ADD SONG
  const addSong = async () => {
    const newSong = { title, file, lyrics }

    const updated = [...data]

    let folderIndex = updated.findIndex((f) => f.folder === folder)

    if (folderIndex === -1) {
      updated.push({
        folder,
        type: "flat",
        songs: [newSong],
      })
    } else {
      if (subfolder) {
        const subIndex =
          updated[folderIndex].subfolders?.findIndex(
            (s: any) => s.name === subfolder
          )

        if (subIndex !== -1) {
          updated[folderIndex].subfolders[subIndex].songs.push(newSong)
        }
      } else {
        updated[folderIndex].songs.push(newSong)
      }
    }

    setData(updated)
    await saveToCloud(updated)
  }

  // DELETE SONG
  const deleteSong = async (titleToDelete: string) => {
    const updated = data.map((folder: any) => {
      if (folder.type === "flat") {
        return {
          ...folder,
          songs: folder.songs.filter(
            (s: any) => s.title !== titleToDelete
          ),
        }
      }

      if (folder.type === "nested") {
        return {
          ...folder,
          subfolders: folder.subfolders.map((sub: any) => ({
            ...sub,
            songs: sub.songs.filter(
              (s: any) => s.title !== titleToDelete
            ),
          })),
        }
      }

      return folder
    })

    setData(updated)
    await saveToCloud(updated)
  }

  // UPDATE SONG
  const updateSong = async () => {
    const updated = data.map((folder: any) => {
      if (folder.type === "flat") {
        return {
          ...folder,
          songs: folder.songs.map((s: any) =>
            s.title === editSong.title
              ? { ...s, title: editTitle, lyrics: editLyrics }
              : s
          ),
        }
      }

      if (folder.type === "nested") {
        return {
          ...folder,
          subfolders: folder.subfolders.map((sub: any) => ({
            ...sub,
            songs: sub.songs.map((s: any) =>
              s.title === editSong.title
                ? { ...s, title: editTitle, lyrics: editLyrics }
                : s
            ),
          })),
        }
      }

      return folder
    })

    setEditSong(null)
    setData(updated)
    await saveToCloud(updated)
  }

  // SEARCH FILTER
  const filtered = data

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="border p-6 w-80">
          <h1 className="text-xl font-bold mb-4">Admin Login</h1>

          <input
            type="password"
            placeholder="Enter password"
            className="border p-2 w-full mb-3 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="bg-blue-500 text-white px-4 py-2 w-full"
            onClick={() => {
              if (password === "admin123") {
                setIsLoggedIn(true)
              } else {
                alert("Wrong password")
              }
            }}
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  // MAIN ADMIN UI
  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

      {/* SEARCH */}
      <input
        className="border p-2 w-full mb-4"
        placeholder="Search songs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* ADD SONG */}
      <div className="border p-4 mb-4">
        <input
          className="border p-2 w-full mb-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-2"
          placeholder="File URL"
          value={file}
          onChange={(e) => setFile(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-2"
          placeholder="Folder"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-2"
          placeholder="Subfolder"
          value={subfolder}
          onChange={(e) => setSubfolder(e.target.value)}
        />

        <textarea
          className="border p-2 w-full mb-2"
          placeholder="Lyrics"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
        />

        <button
          className="bg-green-500 text-white px-4 py-2"
          onClick={addSong}
        >
          Add Song
        </button>
      </div>

      {/* SONG LIST */}
      {filtered.map((folder: any) =>
        folder.songs?.map((song: any) => (
          <div key={song.title} className="border p-3 mb-2">

            <div className="font-bold">{song.title}</div>

            <button
              className="bg-blue-500 text-white px-2 py-1 mr-2"
              onClick={() => {
                setEditSong(song)
                setEditTitle(song.title)
                setEditLyrics(song.lyrics)
              }}
            >
              Edit
            </button>

            <button
              className="bg-red-500 text-white px-2 py-1"
              onClick={() => deleteSong(song.title)}
            >
              Delete
            </button>
          </div>
        ))
      )}

      {/* EDIT POPUP */}
      {editSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 text-black">

          <h2 className="font-bold mb-2">Edit Song</h2>

          <input
            className="border p-2 w-full mb-2"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <textarea
            className="border p-2 w-full mb-2"
            value={editLyrics}
            onChange={(e) => setEditLyrics(e.target.value)}
          />

          <button
            className="bg-green-500 text-white px-4 py-2 mr-2"
            onClick={updateSong}
          >
            Save
          </button>

          <button
            className="bg-gray-400 text-white px-4 py-2"
            onClick={() => setEditSong(null)}
          >
            Cancel
          </button>

        </div>
      )}

    </div>
  )
}