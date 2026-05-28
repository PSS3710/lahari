"use client"

import { useEffect, useState } from "react"

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false)
  const [password, setPassword] = useState("")

  const [data, setData] = useState<any[]>([])

  const [title, setTitle] = useState("")
  const [file, setFile] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [folder, setFolder] = useState("")
  const [subfolder, setSubfolder] = useState("")

  const [search, setSearch] = useState("")

  const [editSong, setEditSong] = useState<any>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editLyrics, setEditLyrics] = useState("")

  // LOAD DATA
  useEffect(() => {
    fetch("/songs.json")
      .then((res) => res.json())
      .then((json) => setData(json))
  }, [])

  // LOGIN
  const handleLogin = () => {
    if (password === "1234") {
      setIsAuth(true)
    } else {
      alert("Wrong password")
    }
  }

  // ADD SONG
  const addSong = async () => {
    const res = await fetch("/api/add-song", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        file,
        lyrics,
        folder,
        subfolder,
      }),
    })

    const data = await res.json()

    if (data.success) {
      alert("Song added")
      location.reload()
    } else {
      alert("Error")
    }
  }

  // UPDATE SONG
  const updateSong = async () => {
    await fetch("/api/update-song", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: editSong.file,
        action: "edit",
        newTitle: editTitle,
        newLyrics: editLyrics,
      }),
    })

    setEditSong(null)
    location.reload()
  }

  // DELETE SONG
  const deleteSong = async (file: string) => {
    await fetch("/api/update-song", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file,
        action: "delete",
      }),
    })

    location.reload()
  }

  // FILTER SONGS (SEARCH)
  const filteredData = data.map((folder: any) => {
    if (folder.type === "flat") {
      return {
        ...folder,
        songs: folder.songs.filter((song: any) =>
          song.title.toLowerCase().includes(search.toLowerCase())
        ),
      }
    }

    if (folder.type === "nested") {
      return {
        ...folder,
        subfolders: folder.subfolders.map((sub: any) => ({
          ...sub,
          songs: sub.songs.filter((song: any) =>
            song.title.toLowerCase().includes(search.toLowerCase())
          ),
        })),
      }
    }

    return folder
  })

  // LOGIN SCREEN
  if (!isAuth) {
    return (
      <div className="p-10">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="border p-2"
        />

        <button
          onClick={handleLogin}
          className="ml-3 bg-black text-white px-4 py-2"
        >
          Login
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">

      <h1 className="text-2xl font-bold">Admin Panel</h1>

      {/* ADD SONG */}
      <div className="border p-4 rounded space-y-2">

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song Title"
          className="border p-2 w-full"
        />

        <input
          value={file}
          onChange={(e) => setFile(e.target.value)}
          placeholder="MP3 URL"
          className="border p-2 w-full"
        />

        <input
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder="Folder"
          className="border p-2 w-full"
        />

        <input
          value={subfolder}
          onChange={(e) => setSubfolder(e.target.value)}
          placeholder="Subfolder"
          className="border p-2 w-full"
        />

        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="Lyrics"
          className="border p-2 w-full"
        />

        <button
          onClick={addSong}
          className="bg-green-500 text-white px-4 py-2"
        >
          Add Song
        </button>

      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search songs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 w-full"
      />

      {/* SONG LIST */}
      <h2 className="text-xl font-bold mt-6">Songs</h2>

      {filteredData.map((folder: any) =>
        folder.type === "flat"
          ? folder.songs.map((song: any) => (
              <div key={song.file} className="border p-3 mt-2">

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
                  onClick={() => deleteSong(song.file)}
                >
                  Delete
                </button>

              </div>
            ))
          : folder.subfolders?.map((sub: any) =>
              sub.songs.map((song: any) => (
                <div key={song.file} className="border p-3 mt-2">

                  <div className="font-bold">{song.title}</div>
                  <div className="text-sm text-gray-500">{sub.name}</div>

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
                    onClick={() => deleteSong(song.file)}
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

    <h2 className="font-bold mb-2 text-black">Edit Song</h2>

    <input
      className="border p-2 w-full mb-2 text-black bg-white"
      value={editTitle}
      onChange={(e) => setEditTitle(e.target.value)}
    />

    <textarea
      className="border p-2 w-full mb-2 text-black bg-white"
      value={editLyrics}
      onChange={(e) => setEditLyrics(e.target.value)}
    />

    <div className="flex gap-2">
      <button
        className="bg-green-500 text-white px-4 py-2"
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

  </div>
)}

    </div>
  )
}