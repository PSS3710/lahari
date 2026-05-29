"use client"

import { useEffect, useState } from "react"

export default function AdminPage() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState("")

  const [title, setTitle] = useState("")
  const [file, setFile] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [folder, setFolder] = useState("")
  const [subfolder, setSubfolder] = useState("")

  const [editSong, setEditSong] = useState<any>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editLyrics, setEditLyrics] = useState("")

  // LOAD FROM CLOUDINARY
  useEffect(() => {
    fetch("https://res.cloudinary.com/dsvwf5ywy/raw/upload/v1780027280/songs_gxdsdg.json")
      .then((res) => res.json())
      .then((json) => setData(json))
  }, [])

  // FILTER SEARCH
  const filteredData = data.map((folderItem: any) => {
    if (folderItem.type === "flat") {
      return {
        ...folderItem,
        songs: folderItem.songs.filter((s: any) =>
          s.title.toLowerCase().includes(search.toLowerCase())
        ),
      }
    }

    if (folderItem.type === "nested") {
      return {
        ...folderItem,
        subfolders: folderItem.subfolders.map((sub: any) => ({
          ...sub,
          songs: sub.songs.filter((s: any) =>
            s.title.toLowerCase().includes(search.toLowerCase())
          ),
        })),
      }
    }

    return folderItem
  })

  // SAVE TO CLOUDINARY
  const saveToCloud = async (updatedData: any) => {
    await fetch("/api/save-songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs: updatedData }),
    })

    setData(updatedData)
  }

  // ADD SONG
  const addSong = async () => {
    const newSong = {
      title,
      file,
      lyrics,
    }

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
        const subIndex = updated[folderIndex].subfolders.findIndex(
          (s: any) => s.name === subfolder
        )

        if (subIndex !== -1) {
          updated[folderIndex].subfolders[subIndex].songs.push(newSong)
        }
      } else {
        updated[folderIndex].songs.push(newSong)
      }
    }

    await saveToCloud(updated)
  }

  // DELETE SONG
  const deleteSong = async (songTitle: string) => {
    const updated = data.map((folder: any) => {
      if (folder.type === "flat") {
        return {
          ...folder,
          songs: folder.songs.filter((s: any) => s.title !== songTitle),
        }
      }

      if (folder.type === "nested") {
        return {
          ...folder,
          subfolders: folder.subfolders.map((sub: any) => ({
            ...sub,
            songs: sub.songs.filter((s: any) => s.title !== songTitle),
          })),
        }
      }

      return folder
    })

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
    await saveToCloud(updated)
  }

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
        <input placeholder="Title" className="border p-2 w-full mb-2"
          value={title} onChange={(e) => setTitle(e.target.value)} />

        <input placeholder="File URL" className="border p-2 w-full mb-2"
          value={file} onChange={(e) => setFile(e.target.value)} />

        <input placeholder="Folder" className="border p-2 w-full mb-2"
          value={folder} onChange={(e) => setFolder(e.target.value)} />

        <input placeholder="Subfolder" className="border p-2 w-full mb-2"
          value={subfolder} onChange={(e) => setSubfolder(e.target.value)} />

        <textarea placeholder="Lyrics" className="border p-2 w-full mb-2"
          value={lyrics} onChange={(e) => setLyrics(e.target.value)} />

        <button className="bg-green-500 text-white px-4 py-2" onClick={addSong}>
          Add Song
        </button>
      </div>

      {/* SONG LIST */}
      {filteredData.map((folder: any) =>
        folder.type === "flat"
          ? folder.songs.map((song: any) => (
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
          : folder.subfolders?.map((sub: any) =>
              sub.songs.map((song: any) => (
                <div key={song.title} className="border p-3 mb-2">

                  <div className="font-bold">{song.title}</div>
                  <div className="text-sm">{sub.name}</div>

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
            )
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