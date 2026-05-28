"use client"

import { useState } from "react"

export default function Admin() {

  const [password, setPassword] = useState("")
  const [isAuth, setIsAuth] = useState(false)

  const [title, setTitle] = useState("")
  const [file, setFile] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [folder, setFolder] = useState("")
  const [subfolder, setSubfolder] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<any>(null)

  const handleLogin = () => {
    if (password === "1234") {
      setIsAuth(true)
    } else {
      alert("Wrong password")
    }
  }

  const addSong = async () => {

    const res = await fetch("/api/add-song", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        file,
        lyrics,
        folder,
        subfolder
      })
    })

    const data = await res.json()

    if (data.success) {
      alert("Song added!")
      setTitle("")
      setFile("")
      setLyrics("")
      setFolder("")
      setSubfolder("")
    } else {
      alert("Error adding song")
    }
  }

  if (!isAuth) {
    return (
      <div className="p-10">
        <h1 className="text-xl mb-4">Admin Login</h1>

        <input
          type="password"
          placeholder="Enter password"
          className="border p-2"
          onChange={(e) => setPassword(e.target.value)}
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
    <div className="p-10 space-y-3">

      <h1 className="text-2xl font-bold">Add Song</h1>

      <input placeholder="Title" className="border p-2 w-full" onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Cloudinary URL" className="border p-2 w-full" onChange={(e) => setFile(e.target.value)} />
      <input placeholder="Folder" className="border p-2 w-full" onChange={(e) => setFolder(e.target.value)} />
      <input placeholder="Subfolder" className="border p-2 w-full" onChange={(e) => setSubfolder(e.target.value)} />

      <textarea placeholder="Lyrics" className="border p-2 w-full" onChange={(e) => setLyrics(e.target.value)} />

      <button
        onClick={addSong}
        className="bg-green-500 text-white px-4 py-2"
      >
        Add Song
      </button>

    </div>
  )
}