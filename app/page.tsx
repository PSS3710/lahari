"use client"
 
import { useEffect, useState, useRef } from "react"
 
const CLOUD_URL =
  "https://res.cloudinary.com/dsvwf5ywy/raw/upload/songs_zdzvpz.json"
 
const C = {
  bg: "#FBF6EE",
  card: "#FFFFFF",
  line: "#E8D9BF",
  gold: "#C98A3E",
  maroon: "#5B1F1F",
  cream: "#F4E3C1",
  text: "#3A1F18",
  soft: "#8A6A4A",
}
 
function FolderCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl px-5 py-4 flex items-center justify-between"
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        color: C.maroon,
      }}
    >
      <span className="text-lg">{label}</span>
      <span style={{ color: C.gold }}>›</span>
    </div>
  )
}
 
function SongRow({
  song,
  active,
  onPlay,
  sub,
}: {
  song: any
  active: boolean
  onPlay: () => void
  sub?: string
}) {
  return (
    <div
      onClick={onPlay}
      className="cursor-pointer rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        background: C.card,
        border: `1px solid ${active ? C.gold : C.line}`,
        color: C.text,
      }}
    >
      <span style={{ color: C.gold }}>▶</span>
      <div>
        <div className="font-semibold" style={{ color: C.maroon }}>
          {song.title}
        </div>
        {sub && (
          <div className="text-sm" style={{ color: C.soft }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}
 
export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = useState<any>(null)
  const [selectedSubFolder, setSelectedSubFolder] = useState<any>(null)
 
  const [search, setSearch] = useState("")
  const [currentSong, setCurrentSong] = useState<any>(null)
  const [activePage, setActivePage] = useState("home")
 
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [lyricsText, setLyricsText] = useState("")
 
  useEffect(() => {
    fetch(CLOUD_URL + "?t=" + Date.now())
      .then((res) => res.text())
      .then((text) => setData(JSON.parse(text)))
      .catch(() => setData([]))
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
        .catch(() => setLyricsText("Lyrics could not be loaded"))
    } else {
      setLyricsText(currentSong.lyrics)
    }
  }, [currentSong])
 
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
    (song.title || "").toLowerCase().includes(search.toLowerCase())
  )
 
  function playSong(song: any) {
    setCurrentSong(song)
    setTimeout(() => {
      audioRef.current?.play()
    }, 100)
  }
 
  function playNextSong() {
    const i = allSongs.findIndex((s: any) => s.title === currentSong?.title)
    if (i !== -1 && i < allSongs.length - 1) playSong(allSongs[i + 1])
  }
 
  function playPreviousSong() {
    const i = allSongs.findIndex((s: any) => s.title === currentSong?.title)
    if (i > 0) playSong(allSongs[i - 1])
  }
 
  function goTo(page: string) {
    setActivePage(page)
    setSearch("")
    if (page !== "search") {
      setSelectedFolder(null)
      setSelectedSubFolder(null)
    }
  }
 
  const navItems = [
    { key: "home", label: "Home" },
    { key: "folders", label: "Folders" },
    { key: "search", label: "Search" },
  ]
 
  const backBtn = (onClick: () => void) => (
    <button
      onClick={onClick}
      className="mb-4 rounded-full px-4 py-1.5 text-sm"
      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.maroon }}
    >
      ← Back
    </button>
  )
 
  return (
    <div
      className="min-h-screen pb-80 font-serif"
      style={{ background: C.bg, color: C.text }}
    >
      {/* HEADER */}
      <div
        className="px-4 pt-8 pb-5 text-center"
        style={{ borderBottom: `2px solid ${C.gold}` }}
      >
        <img
          src="/Amma photo.png"
          alt="
          
                In loving memory"
          className="mx-auto h-28 w-28 rounded-full object-cover"
          style={{ border: `3px solid ${C.gold}` }}
        />
        <h1
          className="mt-3 text-4xl font-medium"
          style={{ color: C.maroon }}
        >
          Lahari
        </h1>
        <p className="mt-1 text-sm" style={{ color: C.soft }}>
          Songs of devotion, in loving memory
        </p>
      </div>
 
      {/* NAVIGATION */}
      <div className="flex justify-center gap-2 px-4 py-4">
        {navItems.map((n) => {
          const on = activePage === n.key
          return (
            <button
              key={n.key}
              onClick={() => goTo(n.key)}
              className="rounded-full px-5 py-2 text-sm"
              style={{
                background: on ? C.maroon : C.card,
                color: on ? C.cream : C.maroon,
                border: `1px solid ${on ? C.maroon : C.line}`,
              }}
            >
              {n.label}
            </button>
          )
        })}
      </div>
 
      <div className="mx-auto max-w-3xl">
        {/* SEARCH PAGE */}
        {activePage === "search" && (
          <div className="px-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search songs..."
              className="mb-4 w-full rounded-xl px-4 py-3"
              style={{
                background: C.card,
                border: `1px solid ${C.line}`,
                color: C.text,
              }}
            />
 
            <div className="space-y-3">
              {filteredSongs.map((song: any, i: number) => (
                <SongRow
                  key={i}
                  song={song}
                  active={currentSong?.title === song.title}
                  onPlay={() => playSong(song)}
                  sub={`${song.folder}${song.subfolder ? ` → ${song.subfolder}` : ""}`}
                />
              ))}
            </div>
          </div>
        )}
 
        {/* HOME + FOLDERS */}
        {(activePage === "home" || activePage === "folders") && (
          <div className="px-4">
            {/* TOP LEVEL FOLDERS */}
            {!selectedFolder && (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.map((folder: any, i: number) => (
                  <FolderCard
                    key={i}
                    label={folder.folder}
                    onClick={() => setSelectedFolder(folder)}
                  />
                ))}
              </div>
            )}
 
            {/* INSIDE A FOLDER */}
            {selectedFolder && !selectedSubFolder && (
              <div>
                {backBtn(() => setSelectedFolder(null))}
 
                <h2
                  className="mb-3 text-2xl"
                  style={{ color: C.maroon }}
                >
                  {selectedFolder.folder}
                </h2>
 
                {(selectedFolder.subfolders || []).length > 0 && (
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    {(selectedFolder.subfolders || []).map((sf: any, i: number) => (
                      <FolderCard
                        key={i}
                        label={sf.name}
                        onClick={() => setSelectedSubFolder(sf)}
                      />
                    ))}
                  </div>
                )}
 
                <div className="space-y-3">
                  {(selectedFolder.songs || []).map((song: any, i: number) => (
                    <SongRow
                      key={i}
                      song={song}
                      active={currentSong?.title === song.title}
                      onPlay={() => playSong(song)}
                    />
                  ))}
                </div>
              </div>
            )}
 
            {/* INSIDE A SUBFOLDER */}
            {selectedSubFolder && (
              <div>
                {backBtn(() => setSelectedSubFolder(null))}
 
                <h2
                  className="mb-3 text-2xl"
                  style={{ color: C.maroon }}
                >
                  {selectedSubFolder.name}
                </h2>
 
                <div className="space-y-3">
                  {(selectedSubFolder.songs || []).map((song: any, i: number) => (
                    <SongRow
                      key={i}
                      song={song}
                      active={currentSong?.title === song.title}
                      onPlay={() => playSong(song)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
 
      {/* PLAYER */}
      {currentSong && (
        <div
          className="fixed bottom-0 left-0 right-0 p-3"
          style={{ background: C.maroon, color: C.cream }}
        >
          <div className="mx-auto max-w-3xl">
            <div className="text-lg">{currentSong.title}</div>
 
            {lyricsText && (
              <pre
                className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg p-3 text-sm"
                style={{ background: C.bg, color: C.text }}
              >
                {lyricsText}
              </pre>
            )}
 
            <div className="mt-3 flex gap-2">
              <button
                onClick={playPreviousSong}
                className="rounded-full px-4 py-1.5 text-sm"
                style={{ border: `1px solid ${C.gold}`, color: C.cream }}
              >
                ⏮ Previous
              </button>
              <button
                onClick={playNextSong}
                className="rounded-full px-4 py-1.5 text-sm"
                style={{ border: `1px solid ${C.gold}`, color: C.cream }}
              >
                Next ⏭
              </button>
            </div>
 
            <audio
              ref={audioRef}
              controls
              src={currentSong.file}
              className="mt-3 w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
 