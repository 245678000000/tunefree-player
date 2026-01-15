import { useState, useRef, useEffect } from 'react'
import {
  searchSongs,
  aggregateSearch,
  getSongUrl,
  getSongPic,
  getSongLyrics,
  parseLyrics,
  SOURCES,
  RECOMMENDED_SONGS
} from './api/tunehub'

// Icons as SVG components
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33z" /></svg>
)

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
)

const LibraryIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 9h-4v4h-2v-4H7V9h4V5h2v4h4v2z"/></svg>
)

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z" /></svg>
)

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.7 3a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h3.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7H5.7zm10 0a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h3.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7h-3.6z" /></svg>
)

const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
)

const PrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
)

const ShuffleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
)

const RepeatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
)

const VolumeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
)

const VolumeMuteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
)

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)

const MusicNoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
)

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
)

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
)

function App() {
  // Navigation state
  const [activeView, setActiveView] = useState('home')
  const [currentView, setCurrentView] = useState('home')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchSource, setSearchSource] = useState('all') // all, netease, kuwo, qq

  // Player state
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isLoading, setIsLoading] = useState(false)
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [favorites, setFavorites] = useState([])

  // Audio ref
  const audioRef = useRef(new Audio())

  // Initialize audio
  useEffect(() => {
    const audio = audioRef.current
    audio.volume = volume

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
    })

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100 || 0)
    })

    audio.addEventListener('ended', () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else {
        playNext()
      }
    })

    audio.addEventListener('canplay', () => {
      setIsLoading(false)
    })

    audio.addEventListener('waiting', () => {
      setIsLoading(true)
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [isRepeat])

  // Handle play/pause
  useEffect(() => {
    if (isPlaying && currentSong) {
      audioRef.current.play().catch(e => {
        console.error('播放失败:', e)
        setIsPlaying(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, currentSong])

  // Search handler
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchError('')
    setSearchResults([])
    setCurrentView('search')
    setActiveView('search')

    try {
      let result
      if (searchSource === 'all') {
        result = await aggregateSearch(searchQuery)
      } else {
        result = await searchSongs(searchQuery, searchSource, 30)
      }

      if (result.code === 200 && result.data) {
        const songs = result.data.results || result.data.list || []
        setSearchResults(songs)

        if (songs.length === 0) {
          setSearchError('未找到相关歌曲，请尝试其他关键词')
        }
      } else {
        setSearchError(result.message || '搜索失败，请稍后再试')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      setSearchError('搜索失败，请检查网络连接后重试')
    } finally {
      setIsSearching(false)
    }
  }

  // Play song
  const playSong = async (song, fromPlaylist = false, index = -1) => {
    try {
      setIsLoading(true)
      const source = song.platform || song.source || SOURCES.NETEASE
      const url = await getSongUrl(song.id, source)
      const pic = getSongPic(song.id, source)

      const songData = {
        id: song.id,
        name: song.name || song.title,
        artist: song.artist || song.singer || song.ar?.[0]?.name || '未知歌手',
        album: song.album || song.al?.name || '未知专辑',
        url: url,
        pic: pic,
        source: source
      }

      setCurrentSong(songData)
      audioRef.current.src = url
      setIsPlaying(true)

      if (!fromPlaylist) {
        setPlaylist([songData])
        setCurrentIndex(0)
      } else {
        setCurrentIndex(index)
      }
    } catch (error) {
      console.error('播放失败:', error)
      setIsLoading(false)
    }
  }

  // Play next song
  const playNext = () => {
    if (playlist.length === 0) return

    let nextIndex
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length)
    } else {
      nextIndex = (currentIndex + 1) % playlist.length
    }

    if (nextIndex < playlist.length) {
      playSong(playlist[nextIndex], true, nextIndex)
    }
  }

  // Play previous song
  const playPrev = () => {
    if (playlist.length === 0) return

    let prevIndex
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length)
    } else {
      prevIndex = currentIndex - 1 < 0 ? playlist.length - 1 : currentIndex - 1
    }

    playSong(playlist[prevIndex], true, prevIndex)
  }

  // Format time
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle progress click
  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * duration
  }

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    audioRef.current.volume = newVolume
  }

  // Toggle play/pause
  const togglePlay = () => {
    if (!currentSong) return
    setIsPlaying(!isPlaying)
  }

  // Toggle favorite
  const toggleFavorite = (song) => {
    const songId = song.id
    if (favorites.includes(songId)) {
      setFavorites(favorites.filter(id => id !== songId))
    } else {
      setFavorites([...favorites, songId])
    }
  }

  // Play all recommended songs
  const playAllRecommended = () => {
    const songs = RECOMMENDED_SONGS.map(song => ({
      ...song,
      source: song.source || SOURCES.NETEASE
    }))
    setPlaylist(songs)
    playSong(songs[0], true, 0)
  }

  // Sidebar navigation items
  const navItems = [
    { id: 'home', icon: <HomeIcon />, label: '发现音乐' },
    { id: 'search', icon: <SearchIcon />, label: '搜索' },
    { id: 'library', icon: <LibraryIcon />, label: '我的收藏' }
  ]

  const sourceTabs = [
    { id: 'all', label: '全部' },
    { id: 'netease', label: '网易云' },
    { id: 'kuwo', label: '酷我' },
    { id: 'qq', label: 'QQ' }
  ]

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <MusicNoteIcon />
          </div>
          <h1>XingPeng</h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveView(item.id)
                setCurrentView(item.id)
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-divider" />

        <div className="sidebar-section">
          <h3 className="sidebar-section-title">正在播放</h3>
          {currentSong ? (
            <div className="now-playing-mini">
              <img
                src={currentSong.pic}
                alt={currentSong.name}
                className="now-playing-cover"
                onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
              />
              <div className="now-playing-info">
                <span className="now-playing-title">{currentSong.name}</span>
                <span className="now-playing-artist">{currentSong.artist}</span>
              </div>
            </div>
          ) : (
            <div className="now-playing-empty">
              <span>选择一首歌开始播放</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Search Bar - Always visible */}
        <header className="header">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-container">
              <SearchIcon />
              <input
                type="text"
                className="search-input"
                placeholder="搜索歌曲、歌手、专辑..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="source-tabs">
              {sourceTabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`source-tab ${searchSource === tab.id ? 'active' : ''}`}
                  onClick={() => setSearchSource(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </form>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {currentView === 'home' && (
            <div className="home-view">
              <div className="section-header">
                <div className="section-title-group">
                  <ChartIcon />
                  <h2>热门推荐</h2>
                </div>
                <button className="play-all-btn" onClick={playAllRecommended}>
                  <PlayIcon />
                  <span>播放全部</span>
                </button>
              </div>
              <div className="content-grid">
                {RECOMMENDED_SONGS.map((song, index) => (
                  <div
                    key={song.id}
                    className={`music-card ${currentSong?.id === song.id ? 'playing' : ''}`}
                    onClick={() => {
                      setPlaylist(RECOMMENDED_SONGS)
                      playSong(song, true, index)
                    }}
                  >
                    <div className="music-card-image-wrapper">
                      <img
                        src={getSongPic(song.id, song.source)}
                        alt={song.name}
                        className="music-card-image"
                        loading="lazy"
                        onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
                      />
                      <div className="music-card-play-btn">
                        {currentSong?.id === song.id && isPlaying ? <PauseIcon /> : <PlayIcon />}
                      </div>
                      <div className="music-card-overlay" />
                    </div>
                    <div className="music-card-info">
                      <div className="music-card-title">{song.name}</div>
                      <div className="music-card-artist">{song.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'search' && (
            <div className="search-view">
              <h2 className="view-title">
                {searchQuery ? `"${searchQuery}" 的搜索结果` : '搜索音乐'}
              </h2>

              {isSearching ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <p>正在搜索...</p>
                </div>
              ) : searchError ? (
                <div className="empty-state">
                  <div className="empty-icon error">!</div>
                  <h3>搜索失败</h3>
                  <p>{searchError}</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="search-results">
                  <div className="results-header">
                    <span className="results-count">找到 {searchResults.length} 首歌曲</span>
                    <button
                      className="play-all-btn small"
                      onClick={() => {
                        setPlaylist(searchResults)
                        playSong(searchResults[0], true, 0)
                      }}
                    >
                      <PlayIcon />
                      <span>播放全部</span>
                    </button>
                  </div>
                  <div className="song-list">
                    {searchResults.map((song, index) => (
                      <div
                        key={`${song.id}-${index}`}
                        className={`song-item ${currentSong?.id === song.id ? 'playing' : ''}`}
                        onClick={() => {
                          setPlaylist(searchResults)
                          playSong(song, true, index)
                        }}
                      >
                        <span className="song-index">{index + 1}</span>
                        <img
                          src={getSongPic(song.id, song.platform || song.source)}
                          alt={song.name}
                          className="song-cover"
                          onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
                        />
                        <div className="song-info">
                          <span className="song-name">{song.name || song.title}</span>
                          <span className="song-artist">
                            {song.artist || song.singer || song.ar?.[0]?.name || '未知歌手'}
                          </span>
                        </div>
                        <span className="song-platform">
                          {song.platform === 'netease' ? '网易云' :
                           song.platform === 'kuwo' ? '酷我' :
                           song.platform === 'qq' ? 'QQ' : ''}
                        </span>
                        <button
                          className="song-play-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPlaylist(searchResults)
                            playSong(song, true, index)
                          }}
                        >
                          {currentSong?.id === song.id && isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <SearchIcon />
                  </div>
                  <h3>搜索你喜欢的音乐</h3>
                  <p>输入歌曲名、歌手名开始搜索</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'library' && (
            <div className="library-view">
              <h2 className="view-title">我的收藏</h2>
              <div className="empty-state">
                <div className="empty-icon">
                  <HeartIcon filled={false} />
                </div>
                <h3>暂无收藏</h3>
                <p>播放歌曲时点击爱心即可收藏</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Player Bar */}
      <footer className="player-bar">
        {/* Left - Current Song */}
        <div className="player-left">
          {currentSong ? (
            <>
              <img
                src={currentSong.pic}
                alt={currentSong.name}
                className="player-cover"
                onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
              />
              <div className="player-info">
                <div className="player-title">{currentSong.name}</div>
                <div className="player-artist">{currentSong.artist}</div>
              </div>
              <button
                className={`player-like-btn ${favorites.includes(currentSong.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(currentSong)}
              >
                <HeartIcon filled={favorites.includes(currentSong.id)} />
              </button>
            </>
          ) : (
            <>
              <div className="player-cover-placeholder" />
              <div className="player-info">
                <div className="player-title">未播放</div>
                <div className="player-artist">选择一首歌曲开始播放</div>
              </div>
            </>
          )}
        </div>

        {/* Center - Controls */}
        <div className="player-center">
          <div className="player-controls">
            <button
              className={`player-control-btn ${isShuffle ? 'active' : ''}`}
              onClick={() => setIsShuffle(!isShuffle)}
              title="随机播放"
            >
              <ShuffleIcon />
            </button>
            <button className="player-control-btn" onClick={playPrev} title="上一首">
              <PrevIcon />
            </button>
            <button
              className={`player-control-btn play-btn ${isLoading ? 'loading' : ''}`}
              onClick={togglePlay}
              disabled={!currentSong}
              title={isPlaying ? '暂停' : '播放'}
            >
              {isLoading ? (
                <div className="btn-spinner" />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>
            <button className="player-control-btn" onClick={playNext} title="下一首">
              <NextIcon />
            </button>
            <button
              className={`player-control-btn ${isRepeat ? 'active' : ''}`}
              onClick={() => setIsRepeat(!isRepeat)}
              title="单曲循环"
            >
              <RepeatIcon />
            </button>
          </div>
          <div className="player-progress">
            <span className="progress-time">{formatTime(currentTime)}</span>
            <div className="progress-container" onClick={handleProgressClick}>
              <div className="progress-bg" />
              <div className="progress-bar" style={{ width: `${progress}%` }} />
              <div className="progress-handle" style={{ left: `${progress}%` }} />
            </div>
            <span className="progress-time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right - Volume */}
        <div className="player-right">
          <button
            className="player-control-btn"
            onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
          >
            {volume > 0 ? <VolumeIcon /> : <VolumeMuteIcon />}
          </button>
          <div className="volume-container">
            <input
              type="range"
              className="volume-slider"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
            />
            <div className="volume-fill" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
