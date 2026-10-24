"use client"
 
import { useEffect, useState, useRef } from "react"
 
const CLOUD_URL =
  "https://res.cloudinary.com/dsvwf5ywy/raw/upload/songs_zdzvpz.json"
 
const C = {
  bg: "#FBF6EE",
  card: "#FFFFFF",
  line: "#E8D9BF",
  gold: "#C98A3E",
  maroon: "#6e2828",
  cream: "#F4E3C1",
  text: "#3a0404",
  soft: "#8A6A4A",
  lyricbg: "#e25b26",
}
const LYRIC_SIZES = [18, 24, 32, 42, 54]
function formatTime(t: number) {
  if (!isFinite(t)) return "0:00"
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
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
  const [lyricsLang, setLyricsLang] = useState<"english" | "tamil">("english")
  const [showSplash, setShowSplash] = useState(false)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [sizeIndex, setSizeIndex] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
 
  useEffect(() => {
    fetch(CLOUD_URL + "?t=" + Date.now())
      .then((res) => res.text())
      .then((text) => setData(JSON.parse(text)))
      .catch(() => setData([]))
  }, [])

  useEffect(() => {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  const forced =
    new URLSearchParams(window.location.search).get("splash") === "1"

  if (standalone || forced) {
    setShowSplash(true)
    const t = setTimeout(() => setShowSplash(false), 2200)
    return () => clearTimeout(t)
  }
}, [])
 
  useEffect(() => {
  const source =
    lyricsLang === "tamil" ? currentSong?.lyricsTamil : currentSong?.lyrics

  if (!source) {
    setLyricsText(
      lyricsLang === "tamil" && currentSong
        ? "Tamil lyrics not available yet"
        : ""
    )
    return
  }

  if (source.startsWith("http")) {
    fetch(source)
      .then((res) => res.text())
      .then((text) => setLyricsText(text))
      .catch(() => setLyricsText("Lyrics could not be loaded"))
  } else {
    setLyricsText(source)
  }
}, [currentSong, lyricsLang])
 
  const allSongs = data.flatMap((folder: any) => [
     ...(folder.songs || []).map((song: any) => ({
       ...song,
       folder: folder.folder,
       subfolder: "",
     })),
     ...(folder.subfolders || []).flatMap((sf: any) =>
       (sf.songs || []).map((song: any) => ({
         ...song,
         folder: folder.folder,
         subfolder: sf.name,
       }))
     ),
   ])
 
  const filteredSongs = allSongs.filter((song: any) =>
    (song.title || "").toLowerCase().includes(search.toLowerCase())
  )
  useEffect(() => {
  try {
    const saved = localStorage.getItem("lahariLyricSize")
    if (saved !== null) {
      const n = Number(saved)
      if (n >= 0 && n < LYRIC_SIZES.length) setSizeIndex(n)
    }
  } catch {}
}, [])

function changeSize(delta: number) {
  const n = Math.min(LYRIC_SIZES.length - 1, Math.max(0, sizeIndex + delta))
  setSizeIndex(n)
  try {
    localStorage.setItem("lahariLyricSize", String(n))
  } catch {}
}
function togglePlay() {
  const a = audioRef.current
  if (!a) return
  if (a.paused) {
    a.play().catch(() => {})
  } else {
    a.pause()
  }
}
  function playSong(song: any) {
    setCurrentSong(song)
    setTimeout(() => {
      audioRef.current?.play()
    }, 100)
  }
 
  function playNextSong() {
    const i = allSongs.findIndex((s: any) => s.file === currentSong?.file)
    if (i !== -1 && i < allSongs.length - 1) playSong(allSongs[i + 1])
  }
 
  function playPreviousSong() {
    const i = allSongs.findIndex((s: any) => s.file === currentSong?.file)
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
      className="min-h-screen pb-44 font-serif"
      style={{ background: C.bg, color: C.text }}
    >
    {showSplash && (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: C.bg }}
      >
        <img
          src="/backdropp192.png"
          alt=""
          className="h-32 w-32 rounded-full object-cover"
          style={{ border: `3px solid ${C.gold}` }}
        />
        <h1 className="mt-5 text-4xl font-medium" style={{ color: C.maroon }}>
          Lahari Annapoorna
        </h1>
        <p className="mt-2 text-base" style={{ color: C.soft }}>
          Songs of devotion, in loving memory
        </p>
      </div>
    )}  
      {/* HEADER */}
      <div
        className="px-4 pt-8 pb-5 text-center"
        style={{ borderBottom: `2px solid ${C.gold}` }}
      >
        <img
          src="/Amma photo.png"
          alt="In loving memory"
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
                  active={currentSong?.file === song.file}
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
                      active={currentSong?.file === song.file}
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
                      active={currentSong?.file === song.file}
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
    <>
      {/* The one and only audio element, hidden, controlled by the buttons */}
      <audio
        ref={audioRef}
        src={currentSong.file}
        onEnded={playNextSong}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
        const d = e.currentTarget.duration
        setDuration(isFinite(d) ? d : 0)
        }}
        className="hidden"
          />
 
          {/* MINI PLAYER BAR */}
          <div
            className="fixed bottom-0 left-0 right-0 z-30 shadow-2xl"
            style={{ background: C.lyricbg, color: C.cream }}
          >
            <div className="h-1" style={{ background: "rgba(255,255,255,0.25)" }}>
              <div
                className="h-1"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  background: C.cream,
                }}
              />
            </div>
 
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2">
              <button
                onClick={() => setPlayerOpen(true)}
                aria-label="Open lyrics"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <img
                  src="/backdropp192.png"
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">
                    {currentSong.title}
                  </div>
                  <div className="text-xs opacity-90">Tap to open lyrics ▲</div>
                </div>
              </button>
 
              <button
                onClick={playPreviousSong}
                aria-label="Previous song"
                className="shrink-0 px-2 py-2 text-xl"
              >
                ⏮
              </button>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
                style={{ background: C.cream, color: C.maroon }}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button
                onClick={playNextSong}
                aria-label="Next song"
                className="shrink-0 px-2 py-2 text-xl"
              >
                ⏭
              </button>
            </div>
          </div>
 
          {/* FULL PLAYER: slides up when the mini bar is tapped */}
          <div
            className={`fixed inset-0 z-40 flex flex-col transition-transform duration-300 ${
              playerOpen
                ? "translate-y-0"
                : "pointer-events-none translate-y-full"
            }`}
            style={{ background: C.lyricbg, color: C.cream }}
            aria-hidden={!playerOpen}
          >
            <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col p-4">
              {/* TOP: close and title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlayerOpen(false)}
                  aria-label="Close player"
                  className="shrink-0 rounded-full px-3 py-1 text-2xl"
                  style={{ border: `1px solid ${C.gold}` }}
                >
                  ⌄
                </button>
                <div className="min-w-0 flex-1 text-center">
                  <div className="text-xs uppercase tracking-wide opacity-90">
                    Now playing
                  </div>
                  <div className="truncate text-xl font-semibold">
                    {currentSong.title}
                  </div>
                </div>
                <div className="w-11 shrink-0" />
              </div>
 
              {/* LANGUAGE AND TEXT SIZE */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {[
                  { k: "english", l: "English" },
                  { k: "tamil", l: "Tamil" },
                ].map((o) => {
                  const on = lyricsLang === o.k
                  return (
                    <button
                      key={o.k}
                      onClick={() => setLyricsLang(o.k as "english" | "tamil")}
                      className="rounded-full px-4 py-1.5 text-sm"
                      style={{
                        background: on ? C.cream : "transparent",
                        color: on ? C.maroon : C.cream,
                        border: `1px solid ${C.gold}`,
                      }}
                    >
                      {o.l}
                    </button>
                  )
                })}
 
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => changeSize(-1)}
                    disabled={sizeIndex === 0}
                    aria-label="Smaller text"
                    className="rounded-full px-4 py-1.5 text-sm disabled:opacity-40"
                    style={{ border: `1px solid ${C.gold}` }}
                  >
                    A−
                  </button>
                  <button
                    onClick={() => changeSize(1)}
                    disabled={sizeIndex === LYRIC_SIZES.length - 1}
                    aria-label="Bigger text"
                    className="rounded-full px-4 py-1.5 text-xl disabled:opacity-40"
                    style={{ border: `1px solid ${C.gold}` }}
                  >
                    A+
                  </button>
                </div>
              </div>
 
              {/* LYRICS */}
              <div
                className="mt-3 min-h-0 flex-1 overflow-auto rounded-2xl p-4"
                style={{ background: C.bg, color: C.text }}
              >
                {lyricsText && lyricsText.trim().toUpperCase() !== "NONE" ? (
                  <pre
                    className="whitespace-pre-wrap font-serif"
                    style={{
                      fontSize: LYRIC_SIZES[sizeIndex],
                      lineHeight: 1.7,
                    }}
                  >
                    {lyricsText}
                  </pre>
                ) : (
                  <p className="text-center" style={{ color: C.soft }}>
                    No lyrics for this song yet
                  </p>
                )}
              </div>
 
              {/* PROGRESS */}
              <div className="mt-4">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={1}
                  value={Math.min(currentTime, duration || 0)}
                  onChange={(e) => {
                    const t = Number(e.target.value)
                    if (audioRef.current) audioRef.current.currentTime = t
                    setCurrentTime(t)
                  }}
                  aria-label="Song progress"
                  className="w-full"
                  style={{ accentColor: C.cream }}
                />
                <div className="flex justify-between text-xs opacity-90">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
 
              {/* BIG CONTROLS */}
              <div className="mt-2 flex items-center justify-center gap-8">
                <button
                  onClick={playPreviousSong}
                  aria-label="Previous song"
                  className="p-3 text-3xl"
                >
                  ⏮
                </button>
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                  style={{ background: C.cream, color: C.maroon }}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <button
                  onClick={playNextSong}
                  aria-label="Next song"
                  className="p-3 text-3xl"
                >
                  ⏭
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
 