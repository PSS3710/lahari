"use client"
 
import { useEffect, useState } from "react"
 
const CLOUD_URL =
  "https://res.cloudinary.com/dsvwf5ywy/raw/upload/songs_zdzvpz.json"
 
// Makes a name safe to use as a Cloudinary folder name
const cleanName = (s: string) =>
  (s || "").replace(/[&?#%<>\\/]/g, "").replace(/\s+/g, " ").trim()
 
type Kind = "audio" | "english" | "tamil"
 
export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
 
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState("")
 
  // FORM (used for both adding and editing)
  const [title, setTitle] = useState("")
  const [file, setFile] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [lyricsTamil, setLyricsTamil] = useState("")
  const [folder, setFolder] = useState("")
  const [subfolder, setSubfolder] = useState("")
  const [newFolder, setNewFolder] = useState("")
  const [newSubfolder, setNewSubfolder] = useState("")
  const [uploadMsg, setUploadMsg] = useState("")
  const [dragging, setDragging] = useState("")
  const [driveLinks, setDriveLinks] = useState({
    audio: "",
    english: "",
    tamil: "",
  })
 
  // EDIT MODE: the original audio link identifies the song being edited
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [editOrigin, setEditOrigin] = useState({ folder: "", subfolder: "" })
 
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
 
  // FLATTEN DATA (reads both direct songs and subfolder songs)
  const allSongs = data.flatMap((f: any) => [
    ...(f.songs ?? []).map((song: any) => ({
      ...song,
      folder: f.folder,
      subfolder: "",
    })),
    ...(f.subfolders ?? []).flatMap((sub: any) =>
      (sub.songs ?? []).map((song: any) => ({
        ...song,
        folder: f.folder,
        subfolder: sub.name,
      }))
    ),
  ])
 
  // FOLDER CHOICES
  const folderValue = folder === "__new__" ? newFolder.trim() : folder
  const subfolderValue =
    subfolder === "__new__" ? newSubfolder.trim() : subfolder
 
  const selectedFolderData = data.find((f: any) => f.folder === folder)
  const subfolderOptions = selectedFolderData?.subfolders || []
 
  // SAVE TO CLOUD
  const saveToCloud = async (updatedData: any) => {
    try {
      const res = await fetch("/api/save-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, songs: updatedData }),
      })
 
      const result = await res.json()
 
      if (!res.ok || !result.success) {
        console.error("Save failed:", result)
        alert("Save failed: " + (result.error || "Unknown error"))
        return false
      }
 
      console.log("Saved JSON URL:", result.url)
      alert("Saved successfully")
      return true
    } catch (err) {
      console.error("Save request failed:", err)
      alert("Could not contact the save API")
      return false
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
 
  const setFieldUrl = (kind: Kind, url: string) => {
    if (kind === "audio") setFile(url)
    if (kind === "english") setLyrics(url)
    if (kind === "tamil") setLyricsTamil(url)
  }
 
  const processFile = async (f: File, kind: Kind) => {
    const isAudio = kind === "audio"
    const name = f.name.toLowerCase()
 
    if (
      isAudio &&
      !f.type.startsWith("audio/") &&
      ![".mp3", ".ogg", ".m4a", ".wav"].some((e) => name.endsWith(e))
    ) {
      alert("Please select an audio file.")
      return
    }
 
    if (!isAudio && !name.endsWith(".txt") && f.type !== "text/plain") {
      alert("Please select a .txt lyrics file.")
      return
    }
 
    setUploadMsg(`Uploading ${f.name} ...`)
 
    try {
      const url = await uploadFile(f, isAudio ? "audio" : "text")
 
      if (!url) {
        setUploadMsg("")
        return
      }
 
      setFieldUrl(kind, url)
      setUploadMsg(`Uploaded: ${f.name}`)
    } catch (error) {
      console.error(error)
      setUploadMsg("Upload failed. Please try again.")
    }
  }
 
  const handlePick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: Kind
  ) => {
    const f = e.target.files?.[0]
    if (f) await processFile(f, kind)
    e.target.value = ""
  }
 
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, kind: Kind) => {
    e.preventDefault()
    setDragging("")
 
    const f = e.dataTransfer.files?.[0]
    if (f) await processFile(f, kind)
  }
 
  // IMPORT FROM GOOGLE DRIVE
  const importDrive = async (kind: Kind) => {
    const link = driveLinks[kind].trim()
    if (!link) return
 
    const folderName = cleanName(folderValue)
    const subName = cleanName(subfolderValue)
 
    if (!folderName) {
      alert("Please choose a folder first.")
      return
    }
 
    const assetFolder = subName ? `${folderName}/${subName}` : folderName
 
    setUploadMsg("Importing from Google Drive ...")
 
    try {
      const res = await fetch("/api/import-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          driveUrl: link,
          assetFolder,
          type: kind === "audio" ? "audio" : "text",
        }),
      })
      const result = await res.json()
 
      if (!res.ok || !result.success) {
        alert("Import failed: " + (result.error || "unknown error"))
        setUploadMsg("")
        return
      }
 
      setFieldUrl(kind, result.url)
      setDriveLinks({ ...driveLinks, [kind]: "" })
      setUploadMsg("Imported from Drive")
    } catch {
      alert("Import failed. The file may be too big, so try the file picker.")
      setUploadMsg("")
    }
  }
 
  const driveBox = (kind: Kind) => (
    <div className="flex gap-2 mb-3">
      <input
        placeholder="Or paste a Google Drive link"
        className="border p-2 flex-1"
        value={driveLinks[kind]}
        onChange={(e) =>
          setDriveLinks({ ...driveLinks, [kind]: e.target.value })
        }
      />
      <button
        type="button"
        className="bg-purple-500 text-white px-3 py-2"
        onClick={() => importDrive(kind)}
      >
        Import
      </button>
    </div>
  )
 
  // LIST HELPERS
  const removeSong = (list: any[], fileLink: string) =>
    list.map((f: any) => {
      const next = { ...f }
 
      if (f.songs) {
        next.songs = f.songs.filter((s: any) => s.file !== fileLink)
      }
 
      if (f.subfolders) {
        next.subfolders = f.subfolders.map((sub: any) => ({
          ...sub,
          songs: (sub.songs || []).filter((s: any) => s.file !== fileLink),
        }))
      }
 
      return next
    })
 
  const placeSong = (list: any[], song: any) => {
    const folderIndex = list.findIndex((f: any) => f.folder === folderValue)
 
    if (folderIndex === -1) {
      if (subfolderValue) {
        list.push({
          folder: folderValue,
          type: "nested",
          subfolders: [{ name: subfolderValue, songs: [song] }],
        })
      } else {
        list.push({ folder: folderValue, type: "flat", songs: [song] })
      }
      return list
    }
 
    const target = list[folderIndex]
 
    if (subfolderValue) {
      target.subfolders = target.subfolders || []
      const sub = target.subfolders.find((s: any) => s.name === subfolderValue)
 
      if (sub) {
        sub.songs = sub.songs || []
        sub.songs.push(song)
      } else {
        target.subfolders.push({ name: subfolderValue, songs: [song] })
      }
    } else {
      target.songs = target.songs || []
      target.songs.push(song)
    }
 
    return list
  }
 
  // FORM ACTIONS
  const resetForm = () => {
    setTitle("")
    setFile("")
    setLyrics("")
    setLyricsTamil("")
    setFolder("")
    setSubfolder("")
    setNewFolder("")
    setNewSubfolder("")
    setUploadMsg("")
    setDriveLinks({ audio: "", english: "", tamil: "" })
    setEditingFile(null)
    setEditOrigin({ folder: "", subfolder: "" })
  }
 
  const startEdit = (song: any) => {
    setEditingFile(song.file)
    setEditOrigin({ folder: song.folder, subfolder: song.subfolder || "" })
 
    setTitle(song.title || "")
    setFile(song.file || "")
    setLyrics(song.lyrics || "")
    setLyricsTamil(song.lyricsTamil || "")
    setFolder(song.folder)
    setSubfolder(song.subfolder || "")
    setNewFolder("")
    setNewSubfolder("")
    setUploadMsg("")
    setDriveLinks({ audio: "", english: "", tamil: "" })
 
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
 
  // ADD OR SAVE CHANGES
  const saveSong = async () => {
    if (!title || !file || !folderValue) {
      alert("Please fill the title, the audio file and the folder.")
      return
    }
 
    const newSong = { title, file, lyrics, lyricsTamil }
    const before = data
 
    let updated: any[] = JSON.parse(JSON.stringify(data))
 
    if (editingFile) {
      const sameSpot =
        editOrigin.folder === folderValue &&
        (editOrigin.subfolder || "") === (subfolderValue || "")
 
      if (sameSpot) {
        // Update in place, keeps the song's position
        const swap = (s: any) => (s.file === editingFile ? newSong : s)
 
        updated = updated.map((f: any) => {
          const next = { ...f }
          if (f.songs) next.songs = f.songs.map(swap)
          if (f.subfolders) {
            next.subfolders = f.subfolders.map((sub: any) => ({
              ...sub,
              songs: (sub.songs || []).map(swap),
            }))
          }
          return next
        })
      } else {
        // Folder changed: move the song to its new place
        updated = removeSong(updated, editingFile)
        updated = placeSong(updated, newSong)
      }
    } else {
      updated = placeSong(updated, newSong)
    }
 
    setData(updated)
    const ok = await saveToCloud(updated)
 
    if (ok) {
      resetForm()
    } else {
      setData(before)
    }
  }
 
  // DELETE SONG
  const deleteSong = async (fileToDelete: string) => {
    const before = data
    const updated = removeSong(data, fileToDelete)
 
    setData(updated)
    const ok = await saveToCloud(updated)
 
    if (!ok) {
      setData(before)
      return
    }
 
    if (editingFile === fileToDelete) resetForm()
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
    <div className="p-6 pb-20">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
 
      {/* SEARCH */}
      <input
        className="border p-2 w-full mb-4"
        placeholder="Search songs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
 
      {/* ADD / EDIT SONG */}
      <div
        className={`p-4 mb-4 ${
          editingFile ? "border-2 border-blue-500" : "border"
        }`}
      >
        <h2 className="text-lg font-semibold mb-3">
          {editingFile ? `Editing: ${title || "song"}` : "Add a new song"}
        </h2>
 
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
        <label className="block text-sm font-semibold mb-1">Audio file</label>
        <div
          className={`border-2 border-dashed rounded p-5 mb-3 text-center ${
            dragging === "audio"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-400"
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging("audio")
          }}
          onDragLeave={() => setDragging("")}
          onDrop={(e) => handleDrop(e, "audio")}
        >
          Drop an audio file here, or use the file picker below.
        </div>
        <input
          type="file"
          accept="audio/*"
          className="mb-2 w-full"
          onChange={(e) => handlePick(e, "audio")}
        />
        {driveBox("audio")}
        <input
          placeholder="Audio link (fills in after upload, or paste one)"
          className="border p-2 w-full mb-3"
          value={file}
          onChange={(e) => setFile(e.target.value)}
        />
 
        {/* ENGLISH LYRICS */}
        <label className="block text-sm font-semibold mb-1">
          English lyrics
        </label>
        <div
          className={`border-2 border-dashed rounded p-4 mb-2 text-center ${
            dragging === "english"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-400"
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging("english")
          }}
          onDragLeave={() => setDragging("")}
          onDrop={(e) => handleDrop(e, "english")}
        >
          Drop the English lyrics .txt file here.
        </div>
        <input
          type="file"
          accept=".txt,text/plain"
          className="mb-2 w-full"
          onChange={(e) => handlePick(e, "english")}
        />
        {driveBox("english")}
        <textarea
          placeholder="English lyrics (paste text, or the link fills in after upload)"
          className="border p-2 w-full mb-3"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
        />
 
        {/* TAMIL LYRICS */}
        <label className="block text-sm font-semibold mb-1">Tamil lyrics</label>
        <div
          className={`border-2 border-dashed rounded p-4 mb-2 text-center ${
            dragging === "tamil"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-400"
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging("tamil")
          }}
          onDragLeave={() => setDragging("")}
          onDrop={(e) => handleDrop(e, "tamil")}
        >
          Drop the Tamil lyrics .txt file here.
        </div>
        <input
          type="file"
          accept=".txt,text/plain"
          className="mb-2 w-full"
          onChange={(e) => handlePick(e, "tamil")}
        />
        {driveBox("tamil")}
        <textarea
          placeholder="Tamil lyrics (paste text, or the link fills in after upload)"
          className="border p-2 w-full mb-3"
          value={lyricsTamil}
          onChange={(e) => setLyricsTamil(e.target.value)}
        />
 
        {uploadMsg && (
          <p className="text-sm text-blue-600 mb-2">{uploadMsg}</p>
        )}
 
        <button
          className="bg-green-500 text-white px-4 py-2 mr-2"
          onClick={saveSong}
        >
          {editingFile ? "Save changes" : "Add Song"}
        </button>
 
        {editingFile && (
          <button
            className="bg-gray-400 text-white px-4 py-2"
            onClick={resetForm}
          >
            Cancel
          </button>
        )}
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
              onClick={() => startEdit(song)}
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
    </div>
  )
}
 