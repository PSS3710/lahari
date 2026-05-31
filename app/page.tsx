"use client"

import { useEffect, useState, useRef } from "react"

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = useState<any>(null)
  const [selectedSubFolder, setSelectedSubFolder] = useState<any>(null)

  const [search, setSearch] = useState("")
  const [currentSong, setCurrentSong] = useState<any>(null)

  const [activePage, setActivePage] = useState("home")

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [editSong, setEditSong] = useState<any>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editLyrics, setEditLyrics] = useState("")
  const [lyricsText, setLyricsText] = useState("")

  useEffect(() => {
    fetch("/songs.json")
      .then((res) => res.json())
      .then((json) => setData(json))
  }, [])
  useEffect(() => {
  if (!currentSong?.lyrics) {
    setLyricsText("")
    return
  }

  if (currentSong.lyrics.startsWith("http")) {
    fetch(currentSong.lyrics)
      .then((res) => res.text())
      .then((text) => setLyricsText(text))
      .catch(() => {
        setLyricsText("Lyrics could not be loaded")
      })
  } else {
    setLyricsText(currentSong.lyrics)
  }
}, [currentSong])

  // SEARCH ALL SONGS
  const allSongs = data.flatMap((folder: any) => {
    if (folder.type === "nested") {
      return (folder.subfolders || []).flatMap((sf: any) =>
        (sf.songs || []).map((song: any) => ({
          ...song,
          folder: folder.folder,
          subfolder: sf.name,
        }))
      )
    }

    return (folder.songs || []).map((song: any) => ({
      ...song,
      folder: folder.folder,
    }))
  })

  const filteredSongs = allSongs.filter((song: any) =>
    song.title.toLowerCase().includes(search.toLowerCase())
  )

  function playSong(song: any) {
    setCurrentSong(song)

    setTimeout(() => {
      audioRef.current?.play()
    }, 100)
  }
  function playNextSong() {

  const currentIndex = allSongs.findIndex(
    (song: any) => song.title === currentSong?.title
  )

  if (currentIndex !== -1 && currentIndex < allSongs.length - 1) {
    playSong(allSongs[currentIndex + 1])
  }

}

function playPreviousSong() {

  const currentIndex = allSongs.findIndex(
    (song: any) => song.title === currentSong?.title
  )

  if (currentIndex > 0) {
    playSong(allSongs[currentIndex - 1])
  }

}

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-32">

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

      {/* NAVIGATION */}
      <div className="flex justify-center gap-3 p-4 bg-white border-b">

        <button
          onClick={() => {
            setActivePage("home")
            setSearch("")
          }}
          className="bg-gray-200 px-4 py-2 rounded-xl"
        >
          Home
        </button>

        <button
          onClick={() => {
            setActivePage("folders")
            setSearch("")
          }}
          className="bg-gray-200 px-4 py-2 rounded-xl"
        >
          Folders
        </button>

        <button
          onClick={() => setActivePage("search")}
          className="bg-gray-200 px-4 py-2 rounded-xl"
        >
          Search
        </button>

      </div>

      {/* SEARCH PAGE */}
      {activePage === "search" && (
        <div>

          <div className="p-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search songs..."
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <div className="p-4 space-y-3">

            {filteredSongs.map((song: any, i: number) => (
              <div
                key={i}
                onClick={() => playSong(song)}
                className="bg-white p-4 rounded-xl shadow cursor-pointer"
              >

                <div className="font-semibold">
                  {song.title}
                </div>

                <div className="text-sm text-gray-500">
                  {song.folder}
                  {song.subfolder ? ` → ${song.subfolder}` : ""}
                </div>

              </div>
            ))}

          </div>

        </div>
      )}

      {/* HOME + FOLDERS */}
      {(activePage === "home" || activePage === "folders") && (
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

          {/* NESTED FOLDERS */}
          {selectedFolder &&
            selectedFolder.type === "nested" &&
            !selectedSubFolder && (
              <div className="p-4">

                <button
                  onClick={() => setSelectedFolder(null)}
                  className="bg-gray-200 px-4 py-2 rounded-xl mb-4"
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

          {/* SUBFOLDER SONGS */}
          {selectedSubFolder && (
            <div className="p-4">

              <button
                onClick={() => setSelectedSubFolder(null)}
                className="bg-gray-200 px-4 py-2 rounded-xl mb-4"
              >
                ← Back
              </button>

              {(selectedSubFolder.songs || []).map((song: any, i: number) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-xl shadow mb-4 cursor-pointer"
                  onClick={() => playSong(song)}
                >

                  <div className="font-semibold">
                    {song.title}
                  </div>

                </div>
              ))}

            </div>
          )}

          {/* FLAT FOLDER SONGS */}
          {selectedFolder &&
            selectedFolder.type === "flat" && (
              <div className="p-4">

                <button
                  onClick={() => setSelectedFolder(null)}
                  className="bg-gray-200 px-4 py-2 rounded-xl mb-4"
                >
                  ← Back
                </button>

                {(selectedFolder.songs || []).map((song: any, i: number) => (
                  <div
                    key={i}
                    className="bg-white p-4 rounded-xl shadow mb-4 cursor-pointer"
                    onClick={() => playSong(song)}
                  >

                    <div className="font-semibold">
                      {song.title}
                    </div>

                  </div>
                ))}

              </div>
            )}

        </>
      )}

      {/* MINI PLAYER */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 max-h-60 overflow-auto">

          <div className="font-semibold">
            {currentSong.title}
          </div>

          {lyricsText && (
            <pre className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
              {lyricsText}
            </pre>
          )}
          <div className="flex gap-3 mt-3">

  <button
    onClick={playPreviousSong}
    className="bg-gray-200 px-4 py-2 rounded-xl"
  >
    ⏮ Previous
  </button>

  <button
    onClick={playNextSong}
    className="bg-gray-200 px-4 py-2 rounded-xl"
  >
    Next ⏭
  </button>

</div>

          <audio
            ref={audioRef}
            controls
            src={currentSong.file}
            className="w-full mt-2"
          />

        </div>
      )}

    </div>
  )
}