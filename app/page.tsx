"use client"

import { useEffect, useState, useRef } from "react"

export default function Home() {

  const [data, setData] = useState<any[]>([])

  const [selectedFolder, setSelectedFolder] = useState<any>(null)
  const [selectedSubFolder, setSelectedSubFolder] = useState<any>(null)

  const [search, setSearch] = useState("")
  const [currentSong, setCurrentSong] = useState<any>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetch("/songs.json")
      .then(res => res.json())
      .then(setData)
  }, [])

  // SAFE flatten for search
  const allSongs = data.flatMap((folder: any) => {
    if (folder.type === "nested") {
      return (folder.subfolders || []).flatMap((sf: any) =>
        (sf.songs || []).map((s: any) => ({
          ...s,
          folder: folder.folder,
          subfolder: sf.name
        }))
      )
    } else {
      return (folder.songs || []).map((s: any) => ({
        ...s,
        folder: folder.folder
      }))
    }
  })

  const filteredSongs = allSongs.filter((s: any) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  )

  function playSong(song: any) {
    setCurrentSong(song)
    setTimeout(() => {
      audioRef.current?.play()
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-28">

      {/* HEADER */}
<div className="p-4 bg-white border-b flex items-center justify-center gap-3">

  <img
  src="/Amma photo.png"
  alt="Lahari Logo"
  className="w-10 h-10 rounded-xl object-cover shadow-md"
/>

  <h1 className="text-2xl font-bold">
    Lahari
  </h1>

</div>

      {/* SEARCH BAR */}
      <div className="p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search songs..."
          className="w-full p-3 border rounded-xl"
        />
      </div>

      {/* SEARCH MODE */}
      {search ? (
        <div className="p-4 space-y-3">

          {filteredSongs.map((song: any, i: number) => (
            <div
              key={i}
              onClick={() => playSong(song)}
              className="bg-white p-4 rounded-xl shadow cursor-pointer"
            >
              <div className="font-semibold">{song.title}</div>
              <div className="text-sm text-gray-500">
                {song.folder} {song.subfolder ? `→ ${song.subfolder}` : ""}
              </div>
            </div>
          ))}

        </div>
      ) : (

        <>
          {/* MAIN FOLDERS */}
          {!selectedFolder && (
            <div className="p-4 grid gap-4">

              {data.map((folder: any, i: number) => (
                <div
                  key={i}
                  onClick={() => setSelectedFolder(folder)}
                  className="bg-white p-5 rounded-xl shadow cursor-pointer"
                >
                  {folder.folder}
                </div>
              ))}

            </div>
          )}

          {/* NESTED FOLDER VIEW */}
          {selectedFolder && selectedFolder.type === "nested" && !selectedSubFolder && (
            <div className="p-4">

              <button
                onClick={() => setSelectedFolder(null)}
                className="text-blue-500 mb-4"
              >
                ← Back
              </button>

              <div className="grid gap-4">

                {(selectedFolder.subfolders || []).map((sf: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => setSelectedSubFolder(sf)}
                    className="bg-white p-4 rounded-xl shadow cursor-pointer"
                  >
                    {sf.name}
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* SUBFOLDER SONGS (SAFE FIX HERE) */}
          {selectedSubFolder && (
            <div className="p-4">

              <button
                onClick={() => setSelectedSubFolder(null)}
                className="text-blue-500 mb-4"
              >
                ← Back
              </button>

              {(selectedSubFolder.songs || []).map((song: any, i: number) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-xl shadow mb-4"
                  onClick={() => playSong(song)}
                >
                  <div className="font-semibold">{song.title}</div>
                </div>
              ))}

            </div>
          )}

          {/* FLAT FOLDER SONGS */}
          {selectedFolder && selectedFolder.type === "flat" && (
            <div className="p-4">

              <button
                onClick={() => setSelectedFolder(null)}
                className="text-blue-500 mb-4"
              >
                ← Back
              </button>

              {(selectedFolder.songs || []).map((song: any, i: number) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-xl shadow mb-4"
                  onClick={() => playSong(song)}
                >
                  <div className="font-semibold">{song.title}</div>
                </div>
              ))}

            </div>
          )}
        </>
      )}

      {/* MINI PLAYER */}
      {currentSong && (
        <div className="fixed bottom-14 left-0 right-0 bg-white border-t p-3 max-h-60 overflow-auto">

          <div className="font-semibold">{currentSong.title}</div>

{currentSong.lyrics && (
  <pre className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
    {currentSong.lyrics}
  </pre>
)}

          <audio
            ref={audioRef}
            controls
            src={currentSong.file}
            className="w-full mt-2"
          />

        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3">
        <span>🏠 Home</span>
        <span>🔍 Search</span>
      </div>

    </div>
  )
}