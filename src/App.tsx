import { useEffect, useRef, useState } from 'react'
import {
  Headphones,
  Home,
  Compass,
  Library,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  Search,
  Plus,
  Music2,
  Sparkles,
  Clock3,
} from 'lucide-react'


type Song = {
  id?: string
  title: string
  artist: string
  image: string
  mood: string
  audio?: string
  shareurl?: string
  license?: string
}

type JamendoTrack = {
  id: string
  name: string
  artist_name: string
  image: string
  audio: string
  duration: string
  shareurl: string
  license_ccurl?: string
}

type JamendoResponse = {
  headers: {
    status: string
    error_message?: string
  }
  results: JamendoTrack[]
}


const fallbackSongs: Song[] = [
  {
    title: 'The Night We Met',
    artist: 'Lord Huron',
    image:
      'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=500&auto=format&fit=crop&q=80',
    mood: 'Nostalgic',
    audio: "/music/track-1.mp3"
  },
  {
    title: 'Weightless',
    artist: 'Marconi Union',
    image:
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=500&auto=format&fit=crop&q=80',
    mood: 'Peaceful',
  },
  {
    title: 'Sunset Lover',
    artist: 'Petit Biscuit',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500&auto=format&fit=crop&q=80',
    mood: 'Dreamy',
  },
  {
    title: 'Holocene',
    artist: 'Bon Iver',
    image:
      'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=500&auto=format&fit=crop&q=80',
    mood: 'Reflective',
  },
]

const moods = [
  { label: 'A little comfort', emoji: '☁️' },
  { label: 'Somewhere else', emoji: '🌌' },
  { label: 'A little hope', emoji: '🌅' },
  { label: 'No particular mood', emoji: '🎧' },
]

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function App() {
  const [activeNav, setActiveNav] = useState('Home')
  const [currentSong, setCurrentSong] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [likedSongs, setLikedSongs] = useState<string[]>([])
  const [selectedMood, setSelectedMood] = useState('')
  const [showQueue, setShowQueue] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [songs, setSongs] = useState<Song[]>(fallbackSongs)
  const [isLoadingSongs, setIsLoadingSongs] = useState(false)
  const [songsError, setSongsError] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const song = songs[currentSong]

  useEffect(() => {
    async function fetchSongs() {
      const clientId = import.meta.env.VITE_JAMENDO_CLIENT_ID

      if (!clientId || clientId === 'your_client_id_here') {
        setSongsError('Jamendo Client ID is missing. Check your .env file.')
        return
      }

      setIsLoadingSongs(true)
      setSongsError('')

      try {
        const params = new URLSearchParams({
          client_id: clientId,
          format: 'json',
          limit: '20',
          audioformat: 'mp32',
          include: 'licenses',
        })

        const apiUrl =
          `https://api.jamendo.com/v3.0/tracks/?${params.toString()}`

        console.log('Jamendo request URL:', apiUrl)

        const response = await fetch(apiUrl)

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }

        const data: JamendoResponse = await response.json()

        if (data.headers.status !== 'success') {
          throw new Error(
            data.headers.error_message || 'Jamendo returned an error.'
          )
        }

        const fetchedSongs: Song[] = data.results
          .filter((track) => Boolean(track.audio))
          .map((track) => ({
            id: track.id,
            title: track.name,
            artist: track.artist_name,
            image: track.image,
            mood: 'Chill',
            audio: track.audio,
            shareurl: track.shareurl,
            license: track.license_ccurl,
          }))

        if (fetchedSongs.length === 0) {
          throw new Error('Jamendo returned no playable tracks for this search.')
        }

        setSongs(fetchedSongs)
        setCurrentSong(0)
        setIsPlaying(false)
      } catch (error) {
        console.error('Failed to fetch Jamendo tracks:', error)
        setSongsError(
          error instanceof Error
            ? error.message
            : 'Something went wrong while fetching music.'
        )
      } finally {
        setIsLoadingSongs(false)
      }
    }

    void fetchSongs()
  }, [])

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.pause();
    audio.load();

    if (song.audio && isPlaying) {
      audio.play().catch((error) => {
        console.error("Unable to play audio:", error);
        setIsPlaying(false);
      });
    }
  }, [currentSong]);

  const handlePlayPause = async () => {
  const audio = audioRef.current;

  if (!audio) return;

  try {
    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  } catch (error) {
    console.error("Unable to play audio:", error);
    setIsPlaying(false);
  }
};

  function nextSong() {
    const nextIndex = (currentSong + 1) % songs.length;

    setCurrentSong(nextIndex);
    setIsPlaying(Boolean(songs[nextIndex].audio));
  }

  function previousSong() {
    const previousIndex =
      currentSong === 0 ? songs.length - 1 : currentSong - 1;

    setCurrentSong(previousIndex);
    setIsPlaying(Boolean(songs[previousIndex].audio));
  }

  function toggleLike(title: string) {
    setLikedSongs((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    )
  }

  function startListening() {
    setSelectedMood('')
    setCurrentSong((current) => (current + 1) % songs.length)
    setIsPlaying(true)
  }

  return (
    <div className="app-shell">
      <audio 
        ref={audioRef}
        src={songs[currentSong].audio}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onTimeUpdate={() => {
          setCurrentTime(audioRef.current?.currentTime ?? 0)
        }}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration ?? 0)
        }}
      />
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <div className="brand-icon">
            <Headphones size={23} />
          </div>
          <span>muse<span className="brand-dot">.</span></span>
        </a>

        <p className="nav-heading">YOUR SPACE</p>

        <nav className="nav-list">
          {[
            { label: 'Home', icon: Home },
            { label: 'Discover', icon: Compass },
            { label: 'Your library', icon: Library },
            { label: 'Liked songs', icon: Heart },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activeNav === label ? 'active' : ''}`}
              onClick={() => setActiveNav(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === 'Liked songs' && likedSongs.length > 0 && (
                <span className="nav-count">{likedSongs.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <Sparkles size={19} />
          <p>There is no right way to feel.</p>
          <span>Let the music find you.</span>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar">M</div>
          <div>
            <p className="profile-name">Your space</p>
            <p className="profile-subtitle">Just be here.</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Your space</span>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-current">{activeNav}</span>
          </div>

          <button
            className="icon-button search-button"
            aria-label="Search"
            onClick={() => setActiveNav('Discover')}
          >
            <Search size={19} />
          </button>
        </header>

        {activeNav === 'Liked songs' ? (
          <section className="page-section">
            <p className="eyebrow">YOUR COLLECTION</p>
            <h1 className="page-title">Songs you've kept.</h1>
            <p className="page-description">
              The music you want to come back to.
            </p>
            <div className="song-grid">
              {songs
                .filter((item) => likedSongs.includes(item.title))
                .map((item) => (
                  <button
                    className="song-card"
                    key={item.id ?? item.title}
                    onClick={() => {
                      setCurrentSong(songs.indexOf(item))
                      setIsPlaying(true)
                    }}
                  >
                    <img src={item.image} alt="" />
                    <span className="card-title">{item.title}</span>
                    <span className="card-subtitle">{item.artist}</span>
                  </button>
                ))}
            </div>
            {likedSongs.length === 0 && (
              <p className="empty-message">
                Your collection is waiting. Tap the heart on any song to save it.
              </p>
            )}
          </section>
        ) : (
          <>
            <section className="hero">
              <div className="hero-glow" />
              <div className="hero-content">
                <div className="eyebrow">
                  <span className="status-dot" />
                  YOUR MOMENT, YOUR MUSIC
                </div>

                <h1>
                  You don't have to
                  <br />
                  <span>figure it all out.</span>
                </h1>

                <p className="hero-description">
                  No labels. No questions. Just music that meets you where
                  you are.
                </p>

                <button className="primary-button" onClick={startListening}>
                  <Play size={17} fill="currentColor" />
                  Just listen
                </button>

                <p className="hero-footnote">
                  <Sparkles size={13} />
                  Let the music find its way.
                </p>
              </div>

              <div className="hero-art">
                <div className="art-orbit orbit-one" />
                <div className="art-orbit orbit-two" />
                <img src={song.image} alt="" />
                <div className="art-caption">
                  <span>NOW EXPLORING</span>
                  <strong>{song.mood}</strong>
                </div>
              </div>
            </section>

            <section className="page-section mood-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">ONLY IF YOU WANT TO</p>
                  <h2>What sounds right?</h2>
                </div>
                <span className="optional-label">Completely optional</span>
              </div>

              <div className="mood-list">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    className={`mood-chip ${
                      selectedMood === mood.label ? 'selected' : ''
                    }`}
                    onClick={() =>
                      setSelectedMood((current) =>
                        current === mood.label ? '' : mood.label,
                      )
                    }
                  >
                    <span>{mood.emoji}</span>
                    {mood.label}
                  </button>
                ))}
              </div>

              {selectedMood && (
                <p className="selection-note">
                  <Sparkles size={14} />
                  A little direction, if you want it: {selectedMood}.
                  You can change this anytime.
                </p>
              )}
            </section>

            <section className="page-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">A PLACE TO BEGIN</p>
                  <h2>Music for the in-between.</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => setActiveNav('Discover')}
                >
                  Explore all <span>↗</span>
                </button>
              </div>

              <div className="song-grid">
                {isLoadingSongs && (
                  <p className="music-status">Finding your music...</p>
                )}

                {songsError && (
                  <p className="music-status">{songsError}</p>
                )}
                
                {songs.map((item, index) => (
                  <button
                    className="song-card"
                    key={item.id ?? item.title}
                    onClick={() => {
                      setCurrentSong(index)
                      setIsPlaying(true)
                    }}
                  >
                    <div className="card-image-wrap">
                      <img src={item.image} alt="" />
                      <span className="card-play">
                        <Play size={18} fill="currentColor" />
                      </span>
                    </div>
                    <span className="card-title">{item.title}</span>
                    <span className="card-subtitle">{item.artist}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="quiet-note">
              <div className="quiet-note-icon">
                <Music2 size={21} />
              </div>
              <div>
                <p>You can just listen.</p>
                <span>
                  Muse will never ask you to explain how you feel after every
                  song.
                </span>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="player">
        <div className="player-song">
          <img src={song.image} alt="" />
          <div className="player-song-info">
            <strong>{song.title}</strong>
            <span>{song.artist}</span>
          </div>
          <button
            className={`icon-button like-button ${
              likedSongs.includes(song.title) ? 'liked' : ''
            }`}
            aria-label="Like song"
            onClick={() => toggleLike(song.title)}
          >
            <Heart
              size={18}
              fill={likedSongs.includes(song.title) ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        <div className="player-center">
          <div className="player-controls">
            <button
              className="icon-button secondary-control"
              aria-label="Shuffle"
              title="Shuffle (coming soon)"
            >
              <Shuffle size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Previous song"
              onClick={previousSong}
            >
              <SkipBack size={19} fill="currentColor" />
            </button>
            <button
              className="play-button"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" />
              )}
            </button>
            <button
              className="icon-button"
              aria-label="Next song"
              onClick={nextSong}
            >
              <SkipForward size={19} fill="currentColor" />
            </button>
            <button
              className="icon-button secondary-control"
              aria-label="Repeat"
              title="Repeat (coming soon)"
            >
              <Repeat size={17} />
            </button>
          </div>

          
          <div className="progress-row">
            <span>{formatTime(currentTime)}</span>
            
            <input
              className="progress-slider"
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(currentTime, duration || 0)}
              style={{
                background: `linear-gradient(to right, #b9a3ff ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, #35313f ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%)`,
              }}
              onChange={(event) => {
                const newTime = Number(event.target.value)

                if (audioRef.current) {
                  audioRef.current.currentTime = newTime
                }

                setCurrentTime(newTime)
              }}
              disabled={duration <= 0}
              aria-label="Seek through song"
            />

            <span>{duration > 0 ? formatTime(duration) : '0:00'}</span>
          </div>
        </div>

        <div className="player-extra">
          <span className="playing-label">
            {isPlaying ? 'READY TO PLAY' : 'YOUR MOMENT'}
          </span>
          <button
            className={`icon-button ${showQueue ? 'liked' : ''}`}
            aria-label="Toggle queue"
            onClick={() => setShowQueue((visible) => !visible)}
          >
            <Clock3 size={18} />
          </button>
          <button
            className="icon-button volume-button"
            aria-label="Volume"
            title="Volume control coming soon"
          >
            <Volume2 size={19} />
          </button>
          <button
            className="icon-button"
            aria-label="Add to library"
            title="Add to library"
            onClick={() => toggleLike(song.title)}
          >
            <Plus size={19} />
          </button>
        </div>
      </footer>

      {showQueue && (
        <aside className="queue-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">UP NEXT</p>
              <h2>Your listening queue</h2>
            </div>
            <button
              className="icon-button"
              aria-label="Close queue"
              onClick={() => setShowQueue(false)}
            >
              ×
            </button>
          </div>
          {songs.map((item, index) => (
            <button
              key={item.title}
              className="queue-item"
              onClick={() => {
                setCurrentSong(index)
                setIsPlaying(true)
                setShowQueue(false)
              }}
            >
              <img src={item.image} alt="" />
              <span>
                <strong>{item.title}</strong>
                <small>{item.artist}</small>
              </span>
            </button>
          ))}
        </aside>
      )}
    </div>
  )
}

export default App
