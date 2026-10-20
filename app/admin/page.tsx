"use client"
 
import { useEffect, useState } from "react"
 
const CLOUD_URL =
  "https://res.cloudinary.com/dsvwf5ywy/raw/upload/songs_zdzvpz.json"
 
// Makes a name safe to use as a Cloudinary folder name
const cleanName = (s: string) =>
  (s || "").replace(/[&?#%<>\\/]/g, "").replace(/\s+/g, " ").trim()
 
export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
 
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState("")
 
  const [title, setTitle] = useState("")
  const [file, setFile] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [lyricsTamil, setLyricsTamil] = useState("")
  const [folder, setFolder] = useState("")
  const [subfolder, setSubfolder] = useState("")
  const [newFolder, setNewFolder] = useState("")
  const [newSubfolder, setNewSubfolder] = useState("")
  const [uploadMsg, setUploadMsg] = useState("")
 
  const [editSong, setEditSong] = useState<any>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editLyrics, setEditLyrics] = useState("")
  const [editLyricsTamil, setEditLyricsTamil] = useState("")
 
  // LOAD DATA
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(CLOUD_URL + "?t=" + Date.now())
        const text = await res.text()
        const json = JSON.parse(text)
        setData(json)
      } catch (err) {
        console.log("Load error:", err)
        setData([])
      }
    }
 
    load()
  }, [])
 
  // FLATTEN DATA
  const allSongs = data.flatMap((folder: any) => {
    if (folder.type === "nested") {
      return (folder.subfolders ?? []).flatMap((sub: any) =>
        (sub.songs ?? []).map((song: any) => ({
          ...song,
          folder: folder.folder,
          subfolder: sub.name,
        }))
      )
    }
 
    return (folder.songs ?? []).map((song: any) => ({
      ...song,
      folder: folder.folder,
      subfolder: "",
    }))
  })
 
  // FOLDER CHOICES
  const folderValue = folder === "__new__" ? newFolder.trim() : folder
  const subfolderValue =
    subfolder === "__new__" ? newSubfolder.trim() : subfolder
 
  const selectedFolderData = data.find((f: any) => f.folder === folder)
  const subfolderOptions = selectedFolderData?.subfolders || []
 
  // SAVE TO CLOUD
  const saveToCloud = async (updatedData: any) => {
    const res = await fetch("/api/save-song", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs: updatedData }),
    })
 
    const result = await res.json()
    console.log(result)
 
    if (!result.success) {
      alert("Save failed")
    }
  }
 
  // UPLOAD A FILE TO CLOUDINARY (into Folder/Subfolder)
  const uploadFile = async (f: File, type: "audio" | "text") => {
    const folderName = cleanName(folderValue)
    const subName = cleanName(subfolderValue)
 
    if (!folderName) {
      alert("Please choose a folder first, then pick the file.")
      return null
    }
 
    const assetFolder = subName ? `${folderName}/${subName}` : folderName
 
    const sigRes = await fetch("/api/upload-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, assetFolder }),
    })
    const sig = await sigRes.json()
 
    if (!sig.success) {
      alert(sig.error || "Could not start the upload")
      return null
    }
 
    const form = new FormData()
    form.append("file", f)
    form.append("api_key", sig.apiKey)
    form.append("timestamp", String(sig.timestamp))
    form.append("signature", sig.signature)
    form.append("asset_folder", sig.assetFolder)
    form.append("use_filename", "true")
    form.append("unique_filename", "true")
 
    // Cloudinary stores audio under "video" and text files under "raw"
    const resourceType = type === "audio" ? "video" : "raw"
 
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`,
      { method: "POST", body: form }
    )
    const result = await res.json()
 
    if (!result.secure_url) {
      alert("Upload failed: " + (result.error?.message || "unknown error"))
      return null
    }
 
    return result.secure_url as string
  }
 
  const handlePick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "audio" | "english" | "tamil"
  ) => {
    const f = e.target.files?.[0]
    if (!f) return
 
    setUploadMsg(`Uploading ${f.name} ...`)
 
    const url = await uploadFile(f, kind === "audio" ? "audio" : "text")
 
    if (url) {
      if (kind === "audio") setFile(url)
      if (kind === "english") setLyrics(url)
      if (kind === "tamil") setLyricsTamil(url)
      setUploadMsg(`Uploaded: ${f.name}`)
    } else {
      setUploadMsg("")
    }
 
    e.target.value = ""
  }
 
  // ADD SONG
  const addSong = async () => {
    if (!title || !file || !folderValue) {
      alert("Please fill the title, the audio file and the folder.")
      return
    }
 
    const newSong = { title, file, lyrics, lyricsTamil }
 
    const updated = [...data]
 
    const folderIndex = updated.findIndex((f) => f.folder === folderValue)
 
    if (folderIndex === -1) {
      if (subfolderValue) {
        updated.push({
          folder: folderValue,
          type: "nested",
          subfolders: [{ name: subfolderValue, songs: [newSong] }],
        })
      } else {
        updated.push({
          folder: folderValue,
          type: "flat",
          songs: [newSong],
        })
      }
    } else {
      if (subfolderValue) {
        const subIndex = updated[folderIndex].subfolders?.findIndex(
          (s: any) => s.name === subfolderValue
        )
 
        if (subIndex === -1 || subIndex === undefined) {
          updated[folderIndex].subfolders =
            updated[folderIndex].subfolders || []
 
          updated[folderIndex].subfolders.push({
            name: subfolderValue,
            songs: [newSong],
          })
        } else {
          updated[folderIndex].subfolders[subIndex].songs.push(newSong)
        }
      } else {
        updated[folderIndex].songs = updated[folderIndex].songs || []
        updated[folderIndex].songs.push(newSong)
      }
    }
 
    setData(updated)
    await saveToCloud(updated)
 
    setTitle("")
    setFile("")
    setLyrics("")
    setLyricsTamil("")
    setFolder("")
    setSubfolder("")
    setNewFolder("")
    setNewSubfolder("")
    setUploadMsg("")
  }
 
  // DELETE SONG
  const deleteSong = async (fileToDelete: string) => {
    const updated = data.map((folder: any) => {
      const next = { ...folder }
 
      if (folder.songs) {
        next.songs = folder.songs.filter((s: any) => s.file !== fileToDelete)
      }
 
      if (folder.subfolders) {
        next.subfolders = folder.subfolders.map((sub: any) => ({
          ...sub,
          songs: (sub.songs || []).filter((s: any) => s.file !== fileToDelete),
        }))
      }
 
      return next
    })
 
    setData(updated)
    await saveToCloud(updated)
  }
 
  // UPDATE SONG
  const updateSong = async () => {
    const change = (s: any) =>
      s.file === editSong.file
        ? {
            ...s,
            title: editTitle,
            lyrics: editLyrics,
            lyricsTamil: editLyricsTamil,
          }
        : s
 
    const updated = data.map((folder: any) => {
      const next = { ...folder }
 
      if (folder.songs) {
        next.songs = folder.songs.map(change)
      }
 
      if (folder.subfolders) {
        next.subfolders = folder.subfolders.map((sub: any) => ({
          ...sub,
          songs: (sub.songs || []).map(change),
        }))
      }
 
      return next
    })
 
    setEditSong(null)
    setData(updated)
    await saveToCloud(updated)
  }
 
  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="border p-6 w-80">
          <h1 className="text-xl font-bold mb-4">Admin Login</h1>
 
          <input
            type="password"
            className="border p-2 w-full mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
 
          <button
            className="bg-blue-500 text-white px-4 py-2 w-full"
            onClick={async () => {
              const res = await fetch("/api/admin-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
              })
              const result = await res.json()
 
              if (result.success) {
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
 
  // MAIN UI
  return (
    <div className="p-6 pb-72">
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
          placeholder="Title"
          className="border p-2 w-full mb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
 
        {/* FOLDER */}
        <select
          className="border p-2 w-full mb-2"
          value={folder}
          onChange={(e) => {
            setFolder(e.target.value)
            setSubfolder("")
            setNewSubfolder("")
          }}
        >
          <option value="">-- Select Folder --</option>
          {data.map((f: any, i: number) => (
            <option key={i} value={f.folder}>
              {f.folder}
            </option>
          ))}
          <option value="__new__">+ Add New Folder</option>
        </select>
 
        {folder === "__new__" && (
          <input
            placeholder="Type new folder name"
            className="border p-2 w-full mb-2"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
          />
        )}
 
        {/* SUBFOLDER */}
        <select
          className="border p-2 w-full mb-2"
          value={subfolder}
          onChange={(e) => setSubfolder(e.target.value)}
        >
          <option value="">-- No Subfolder --</option>
          {subfolderOptions.map((sf: any, i: number) => (
            <option key={i} value={sf.name}>
              {sf.name}
            </option>
          ))}
          <option value="__new__">+ Add New Subfolder</option>
        </select>
 
        {subfolder === "__new__" && (
          <input
            placeholder="Type new subfolder name"
            className="border p-2 w-full mb-2"
            value={newSubfolder}
            onChange={(e) => setNewSubfolder(e.target.value)}
          />
        )}
 
        <p className="text-sm text-gray-500 mb-3">
          Files you upload below are saved in Cloudinary under:{" "}
          <b>
            {cleanName(folderValue) || "(choose a folder)"}
            {cleanName(subfolderValue) ? ` / ${cleanName(subfolderValue)}` : ""}
          </b>
        </p>
 
        {/* AUDIO */}
        <label className="block text-sm font-semibold mb-1">Audio file (mp3)</label>
        <input
          type="file"
          accept="audio/*"
          className="mb-2 w-full"
          onChange={(e) => handlePick(e, "audio")}
        />
        <input
          placeholder="Audio link (fills in after upload, or paste one)"
          className="border p-2 w-full mb-3"
          value={file}
          onChange={(e) => setFile(e.target.value)}
        />
 
        {/* ENGLISH LYRICS */}
        <label className="block text-sm font-semibold mb-1">English lyrics</label>
        <input
          type="file"
          accept=".txt,text/plain"
          className="mb-2 w-full"
          onChange={(e) => handlePick(e, "english")}
        />
        <textarea
          placeholder="English lyrics (paste text, or the link fills in after upload)"
          className="border p-2 w-full mb-3"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
        />
 
        {/* TAMIL LYRICS */}
        <label className="block text-sm font-semibold mb-1">Tamil lyrics</label>
        <input
          type="file"
          accept=".txt,text/plain"
          className="mb-2 w-full"
          onChange={(e) => handlePick(e, "tamil")}
        />
        <textarea
          placeholder="Tamil lyrics (paste text, or the link fills in after upload)"
          className="border p-2 w-full mb-3"
          value={lyricsTamil}
          onChange={(e) => setLyricsTamil(e.target.value)}
        />
 
        {uploadMsg && (
          <p className="text-sm text-blue-600 mb-2">{uploadMsg}</p>
        )}
 
        <button className="bg-green-500 text-white px-4 py-2" onClick={addSong}>
          Add Song
        </button>
      </div>
 
      {/* SONG LIST */}
      {allSongs
        .filter((song: any) =>
          (song?.title ?? "").toLowerCase().includes(search.toLowerCase())
        )
        .map((song: any, i: number) => (
          <div key={`${song.file}-${i}`} className="border p-3 mb-2">
            <div className="font-bold">{song.title}</div>
 
            <div className="text-sm text-gray-500">
              {song.folder}
              {song.subfolder ? ` → ${song.subfolder}` : ""}
            </div>
 
            <button
              className="bg-blue-500 text-white px-2 py-1 mr-2"
              onClick={() => {
                setEditSong(song)
                setEditTitle(song.title)
                setEditLyrics(song.lyrics || "")
                setEditLyricsTamil(song.lyricsTamil || "")
              }}
            >
              Edit
            </button>
 
            <button
              className="bg-red-500 text-white px-2 py-1"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete "${song.title}"? This removes it from the website.`
                  )
                ) {
                  deleteSong(song.file)
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
 
      {/* EDIT PANEL */}
      {editSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t text-black max-h-[70vh] overflow-auto">
          <input
            className="border p-2 w-full mb-2"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
 
          <textarea
            className="border p-2 w-full mb-2"
            placeholder="English lyrics"
            value={editLyrics}
            onChange={(e) => setEditLyrics(e.target.value)}
          />
 
          <textarea
            className="border p-2 w-full mb-2"
            placeholder="Tamil lyrics"
            value={editLyricsTamil}
            onChange={(e) => setEditLyricsTamil(e.target.value)}
          />
 
          <button
            className="bg-green-500 px-4 py-2 text-white mr-2"
            onClick={updateSong}
          >
            Save
          </button>
 
          <button
            className="bg-gray-400 px-4 py-2 text-white"
            onClick={() => setEditSong(null)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}