import { useState, useRef, useEffect, useCallback } from 'react'
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
import { useLocalStorage, addToHistory } from './hooks/useLocalStorage'
import { STORAGE_KEYS } from './constants'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useLyrics } from './hooks/useLyrics'
import { usePlaylistManager } from './hooks/usePlaylistManager'
import Sidebar from './components/Sidebar'
import PlayerBar from './components/PlayerBar'
import MainContent from './components/MainContent'
import { formatTime } from './utils/format'

import {
  CloseIcon,
  DragIcon,
  QueueIcon,
  MoonIcon,
  SunIcon,
  SettingsIcon,
  HDIcon,
  DownloadIcon,
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  FolderIcon,
  LyricsIcon,
  ShuffleIcon,
  PrevIcon,
  PlayIcon,
  PauseIcon,
  NextIcon,
  RepeatIcon,
  HeartIcon
} from './components/icons'

// EQ 预设配置
const EQ_PRESETS = {
  flat: { name: '默认', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  pop: { name: '流行', values: [-1, 2, 4, 5, 3, 0, -1, -1, 2, 3] },
  rock: { name: '摇滚', values: [5, 4, 3, 1, -1, -1, 0, 2, 3, 4] },
  classical: { name: '古典', values: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
  electronic: { name: '电子', values: [4, 3, 0, -2, -2, 0, 2, 4, 5, 5] },
  jazz: { name: '爵士', values: [3, 2, 1, 2, -2, -2, 0, 1, 2, 3] },
  bass: { name: '低音增强', values: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  vocal: { name: '人声增强', values: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1] }
}

// EQ 频率
const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

// 音质选项
const QUALITY_OPTIONS = [
  { id: 'standard', label: '标准', bitrate: '128kbps', value: 'standard' },
  { id: 'high', label: '高品质', bitrate: '320kbps', value: 'high' },
  { id: 'lossless', label: '无损', bitrate: 'FLAC', value: 'lossless' }
]

// 主题选项
const THEME_OPTIONS = [
  { id: 'dark', label: '深色', icon: 'moon' },
  { id: 'light', label: '浅色', icon: 'sun' },
  { id: 'system', label: '跟随系统', icon: 'auto' }
]

function App() {
  // Navigation state
  const [activeView, setActiveView] = useState('home')
  const [currentView, setCurrentView] = useState('home')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchSource, setSearchSource] = useState('all')
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  
  // Search history (persisted)
  const [searchHistory, setSearchHistory] = useLocalStorage(STORAGE_KEYS.SEARCH_HISTORY, [])

  // EQ & Settings state (persisted) - NEED BEFORE useAudioPlayer because of audioQuality dependency?
  // Actually hook uses audioQuality.
  const [eqSettings, setEqSettings] = useLocalStorage(STORAGE_KEYS.EQ_SETTINGS, {
    preset: 'flat',
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    enabled: true
  })
  const [audioQuality, setAudioQuality] = useLocalStorage(STORAGE_KEYS.AUDIO_QUALITY, 'high')
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, 'dark')

  // --- Custom Hooks ---
  
  // Audio Player Hook
  const {
    audioRef,
    currentSong,
    isPlaying,
    progress,
    duration,
    currentTime,
    isLoading,
    playlist,
    currentIndex,
    isShuffle,
    isRepeat,
    volume,
    playHistory,
    playSong,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setIsPlaying, // for sleep timer
    setVolume,
    setPlaylist,
    setCurrentIndex,
    setIsShuffle,
    setIsRepeat,
    setPlayHistory
  } = useAudioPlayer(audioQuality)

  // Lyrics Hook
  const {
    lyrics,
    showLyrics,
    currentLyricIndex,
    setShowLyrics,
    toggleLyrics
  } = useLyrics(currentSong, currentTime)

  // Playlist Manager Hook
  const {
    userPlaylists,
    showPlaylistModal,
    editingPlaylist,
    playlistName,
    selectedPlaylistId,
    showAddToPlaylist,
    currentPlaylist,
    setShowPlaylistModal,
    setPlaylistName,
    setShowAddToPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist: hookDeletePlaylist, // Rename to wrap
    addSongToPlaylist,
    removeSongFromPlaylist,
    openCreatePlaylist,
    openEditPlaylist,
    viewPlaylist: hookViewPlaylist // Rename to wrap
  } = usePlaylistManager()

  // Favorites state (Keep in App for now)
  const [favorites, setFavorites] = useLocalStorage(STORAGE_KEYS.FAVORITES, [])
  
  // UI state for EQ and Settings
  const [showEQ, setShowEQ] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Mobile state
  const [showFullPlayer, setShowFullPlayer] = useState(false)
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  // PWA Install Effect
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Queue & Timer state
  const [showQueue, setShowQueue] = useState(false)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [sleepTimer, setSleepTimer] = useState(null)
  const [timerRemaining, setTimerRemaining] = useState(0)


  // Refs (Others)
  const lyricsContainerRef = useRef(null) // Still needed for auto-scroll in App or inside hook? Hook logic didn't include scrolling UI.
  // Actually phase 3 plan said "Effects: 监听 currentSong 变化自动加载歌词，监听 currentTime 更新歌词进度".
  // The scrolling is UI side effect. I'll keep the scrolling effect in App.jsx for now, or move to PlayerBar/Sidebar where lyrics are shown?
  // Lyrics are shown in Sidebar (mini) and PlayerBar (full screen/modal)?
  // Actually lyrics are shown in Sidebar? No, Sidebar has "Now Playing".
  // Let's check where lyrics are rendered.
  // App.jsx: <main className={`main-content ${showLyrics ? 'with-lyrics' : ''}`}>
  // And lyrics overlay?
  // Ah, the monolithic App.jsx probably rendered lyrics overlay.
  // I need to find where lyrics were rendered.
  // Viewing App.jsx lines 1962-2114 in previous turn.
  // It seems I didn't verify where Lyrics UI is.
  // `useLyrics` just provides state.
  // I will assume `lyricsContainerRef` is used in a `useEffect` in `App.jsx` that I haven't deleted yet.
  
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  
  // Audio visualizer refs
  const canvasRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const eqFiltersRef = useRef([])
  const sourceNodeRef = useRef(null)
  const [showVisualizer, setShowVisualizer] = useState(false)

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Apply Theme Effect
  useEffect(() => {
    const applyTheme = (t) => {
      // document.body.className = '' // Reset not needed for data-theme
      const root = document.documentElement
      if (t === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.setAttribute('data-theme', isDark ? 'dark' : 'light')
      } else {
        root.setAttribute('data-theme', t)
      }
    }

    applyTheme(theme)

    // Listen for system changes if theme is 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e) => {
        const root = document.documentElement
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme])

  // ===== Audio Visualizer Logic =====
  useEffect(() => {
    if (!showVisualizer || !audioRef.current || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    // Initialize Audio Context if needed
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        
        // Connect audio source
        // Note: Creating a MediaElementSource from the same audio element multiple times can cause errors.
        // We rely on a check or try/catch. Ideally, useAudioPlayer should expose the node if created there.
        // For now, assuming this is the first time or reuse if possible.
        // BUT strict mode React double invokes effects.
        if (!sourceNodeRef.current) {
           sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)
           sourceNodeRef.current.connect(analyserRef.current)
           analyserRef.current.connect(audioContextRef.current.destination)
        }
      } catch (e) {
        console.warn('AudioContext init failed (possibly already connected):', e)
      }
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!showVisualizer) return
      
      const width = canvas.width
      const height = canvas.height
      
      animationRef.current = requestAnimationFrame(draw)
      
      analyser.getByteFrequencyData(dataArray)
      
      ctx.clearRect(0, 0, width, height)
      
      const barWidth = (width / bufferLength) * 2.5
      let barHeight
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height
        
        // Gradient color based on theme would be nice, but simple green/white for now
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
        gradient.addColorStop(0, '#1db954')
        gradient.addColorStop(1, '#1ed760')
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)
        
        x += barWidth + 1
      }
    }

    // Handle canvas resize
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Start drawing
    draw()

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [showVisualizer, currentSong]) // Re-run if song changes or visibility changes

  // --- Wrappers & Helpers ---

  // Delete Playlist Wrapper (Handles View Change)
  const deletePlaylist = (playlistId) => {
    hookDeletePlaylist(playlistId)
    if (selectedPlaylistId === playlistId) {
      setCurrentView('home')
      setActiveView('home')
    }
  }

  // View Playlist Wrapper (Handles View Change)
  const viewPlaylist = (playlist) => {
    hookViewPlaylist(playlist)
    setCurrentView('playlist')
    setActiveView('playlists')
  }


  
  // Remove from history
  const removeFromHistory = (songId) => {
    setPlayHistory(playHistory.filter(s => s.id !== songId))
  }

  // Clear all history
  const clearHistory = () => {
    setPlayHistory([])
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

  // Handle volume change (UI wrapper)
  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value))
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 不在输入框中时才响应快捷键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          if (e.shiftKey) {
            playPrev()
          } else {
            seek(Math.max(0, currentTime - 5))
          }
          break
        case 'ArrowRight':
          if (e.shiftKey) {
            playNext()
          } else {
            seek(Math.min(duration, currentTime + 5))
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(prev => Math.min(1, prev + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(prev => Math.max(0, prev - 0.1))
          break
        case 'KeyM':
          setVolume(prev => prev > 0 ? 0 : 0.7)
          break
        case 'KeyL':
          if (currentSong) toggleLyrics()
          break
        case 'KeyQ':
          setShowQueue(prev => !prev)
          break
        case 'KeyR':
          setIsRepeat(prev => !prev)
          break
        case 'KeyS':
          setIsShuffle(prev => !prev)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSong, duration, currentTime, togglePlay, playPrev, playNext, seek, setVolume, toggleLyrics, setIsRepeat, setIsShuffle])

  // Sleep timer logic (Keep in App for now)
  useEffect(() => {
    if (sleepTimer === null) {
      setTimerRemaining(0)
      return
    }

    const endTime = sleepTimer
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now())
      setTimerRemaining(remaining)

      if (remaining === 0) {
        setIsPlaying(false)
        setSleepTimer(null)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [sleepTimer, setIsPlaying])
  
  // Auto scroll lyrics (UI side effect)
  useEffect(() => {
    if (showLyrics && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current
      const activeLine = container.querySelector('.lyric-line.active')
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentLyricIndex, showLyrics])

  // Search handler
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setShowSearchSuggestions(false)
    handleSearchWithQuery(searchQuery)
  }

  // Handle progress click
  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * duration
  }

  // Handle lyric click (seek to time)
  const handleLyricClick = (time) => {
    seek(time)
  }

  // ===== Search History Functions =====
  
  // Add to search history
  const addToSearchHistory = (query) => {
    if (!query.trim()) return
    const filtered = searchHistory.filter(q => q !== query)
    setSearchHistory([query, ...filtered].slice(0, 10)) // 保留最近 10 条
  }

  // Remove from search history
  const removeFromSearchHistory = (query) => {
    setSearchHistory(searchHistory.filter(q => q !== query))
  }

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([])
  }

  // Use search suggestion
  const useSearchSuggestion = (query) => {
    setSearchQuery(query)
    setShowSearchSuggestions(false)
    // 自动触发搜索
    handleSearchWithQuery(query)
  }

  // Handle search with specific query
  const handleSearchWithQuery = async (query) => {
    if (!query.trim()) return

    setIsSearching(true)
    setSearchError('')
    setSearchResults([])
    setCurrentView('search')
    setActiveView('search')
    addToSearchHistory(query)

    try {
      let result
      if (searchSource === 'all') {
        result = await aggregateSearch(query)
      } else {
        result = await searchSongs(query, searchSource, 30)
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

  // ===== Queue Management Functions =====
  
  // Remove song from queue
  const removeFromQueue = (index) => {
    if (index === currentIndex) {
      // 如果删除的是当前播放的歌曲，播放下一首
      if (playlist.length > 1) {
        const newPlaylist = playlist.filter((_, i) => i !== index)
        setPlaylist(newPlaylist)
        const newIndex = index >= newPlaylist.length ? 0 : index
        setCurrentIndex(newIndex)
        playSong(newPlaylist[newIndex], true, newIndex)
      } else {
        // 只剩一首，停止播放
        setPlaylist([])
        setCurrentSong(null)
        setIsPlaying(false)
        setCurrentIndex(-1)
      }
    } else {
      const newPlaylist = playlist.filter((_, i) => i !== index)
      setPlaylist(newPlaylist)
      // 更新 currentIndex
      if (index < currentIndex) {
        setCurrentIndex(currentIndex - 1)
      }
    }
  }

  // Move song in queue (drag & drop)
  const moveInQueue = (fromIndex, toIndex) => {
    const newPlaylist = [...playlist]
    const [movedItem] = newPlaylist.splice(fromIndex, 1)
    newPlaylist.splice(toIndex, 0, movedItem)
    setPlaylist(newPlaylist)
    
    // 更新 currentIndex
    if (fromIndex === currentIndex) {
      setCurrentIndex(toIndex)
    } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
      setCurrentIndex(currentIndex - 1)
    } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  // Clear queue (except current song)
  const clearQueue = () => {
    if (currentSong) {
      setPlaylist([currentSong])
      setCurrentIndex(0)
    } else {
      setPlaylist([])
      setCurrentIndex(-1)
    }
  }

  // ===== Sleep Timer Functions =====
  
  // Start sleep timer (minutes)
  const startSleepTimer = (minutes) => {
    if (minutes <= 0) {
      setSleepTimer(null)
      return
    }
    setSleepTimer(Date.now() + minutes * 60 * 1000)
    setShowTimerModal(false)
  }

  // Cancel sleep timer
  const cancelSleepTimer = () => {
    setSleepTimer(null)
  }

  // ===== Favorites Logic =====
  const isFavorited = (id) => {
    return favorites.some(song => song.id === id)
  }

  const toggleFavorite = (song) => {
    if (!song) return
    if (isFavorited(song.id)) {
      setFavorites(favorites.filter(s => s.id !== song.id))
    } else {
      setFavorites([...favorites, {
        id: song.id,
        name: song.name,
        artist: song.artist,
        pic: song.pic,
        source: song.source
      }])
    }
  }

  // ===== EQ Logic =====
  const toggleEQ = () => {
    setEqSettings(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const applyEQPreset = (id) => {
    const preset = EQ_PRESETS[id]
    if (preset) {
      setEqSettings(prev => ({ 
        ...prev, 
        preset: id, 
        values: [...preset.values] 
      }))
    }
  }

  const updateEQBand = (index, value) => {
    setEqSettings(prev => {
      const newValues = [...prev.values]
      newValues[index] = value
      return { ...prev, values: newValues, preset: 'custom' }
    })
  }

  // ===== PWA Logic =====
  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
    setShowInstallPrompt(false)
  }

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false)
  }

  // ===== Touch Gestures =====
  const touchStartRef = useRef(null)
  
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientY
  }
  
  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return
    const touchY = e.touches[0].clientY
    const diff = touchY - touchStartRef.current
    if (diff > 100) { // Swipe down
       setShowFullPlayer(false)
       touchStartRef.current = null
    }
  }
  
  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  // Format timer remaining implementation moved to utils/format.js




  return (
    <div className="app">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={(id) => {
          setActiveView(id)
          setCurrentView(id)
        }}
        currentSong={currentSong}
      />

      {/* Main Content */}
      <MainContent
        activeView={activeView}
        currentView={currentView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        searchError={searchError}
        searchResults={searchResults}
        showSearchSuggestions={showSearchSuggestions}
        setShowSearchSuggestions={setShowSearchSuggestions}
        searchHistory={searchHistory}
        searchSource={searchSource}
        setSearchSource={setSearchSource}
        handleSearch={handleSearch}
        clearSearchHistory={clearSearchHistory}
        removeFromSearchHistory={removeFromSearchHistory}
        useSearchSuggestion={useSearchSuggestion}
        currentSong={currentSong}
        isPlaying={isPlaying}
        favorites={favorites}
        playHistory={playHistory}
        userPlaylists={userPlaylists}
        currentPlaylist={currentPlaylist}
        showLyrics={showLyrics}
        showAddToPlaylist={showAddToPlaylist}
        setShowAddToPlaylist={setShowAddToPlaylist}
        setPlaylist={setPlaylist}
        playSong={playSong}
        playAllRecommended={playAllRecommended}
        toggleFavorite={toggleFavorite}
        clearHistory={clearHistory}
        removeFromHistory={removeFromHistory}
        openCreatePlaylist={openCreatePlaylist}
        openEditPlaylist={openEditPlaylist}
        deletePlaylist={deletePlaylist}
        viewPlaylist={viewPlaylist}
        addSongToPlaylist={addSongToPlaylist}
        removeSongFromPlaylist={removeSongFromPlaylist}
      />

      {/* Playlist Modal */}
      {showPlaylistModal && (
        <div className="modal-overlay" onClick={() => setShowPlaylistModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPlaylist ? '编辑歌单' : '创建歌单'}</h3>
              <button className="modal-close" onClick={() => setShowPlaylistModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="modal-input"
                placeholder="歌单名称"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    editingPlaylist ? updatePlaylist() : createPlaylist()
                  }
                }}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setShowPlaylistModal(false)}>
                取消
              </button>
              <button
                className="modal-btn confirm"
                onClick={editingPlaylist ? updatePlaylist : createPlaylist}
                disabled={!playlistName.trim()}
              >
                {editingPlaylist ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue Panel */}
      {showQueue && (
        <aside className="queue-panel">
          <div className="queue-header">
            <h3>播放队列</h3>
            <div className="queue-actions">
              <button className="queue-clear-btn" onClick={clearQueue} title="清空队列">
                清空
              </button>
              <button className="queue-close-btn" onClick={() => setShowQueue(false)}>
                <CloseIcon />
              </button>
            </div>
          </div>
          <div className="queue-content">
            {playlist.length > 0 ? (
              playlist.map((song, index) => (
                <div
                  key={`${song.id}-${index}`}
                  className={`queue-item ${index === currentIndex ? 'playing' : ''}`}
                  onClick={() => playSong(song, true, index)}
                >
                  <div className="queue-item-drag">
                    <DragIcon />
                  </div>
                  <img
                    src={getSongPic(song.id, song.source)}
                    alt={song.name}
                    className="queue-item-cover"
                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
                  />
                  <div className="queue-item-info">
                    <span className="queue-item-name">{song.name}</span>
                    <span className="queue-item-artist">{song.artist}</span>
                  </div>
                  {index === currentIndex && isPlaying && (
                    <div className="queue-item-playing">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                  <button
                    className="queue-item-remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromQueue(index)
                    }}
                    title="移除"
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))
            ) : (
              <div className="queue-empty">
                <QueueIcon />
                <p>队列是空的</p>
              </div>
            )}
          </div>
          <div className="queue-footer">
            <span>{playlist.length} 首歌曲</span>
          </div>
        </aside>
      )}

      {/* Sleep Timer Modal */}
      {showTimerModal && (
        <div className="modal-overlay" onClick={() => setShowTimerModal(false)}>
          <div className="modal timer-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>睡眠定时器</h3>
              <button className="modal-close" onClick={() => setShowTimerModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body timer-options">
              {sleepTimer && (
                <div className="timer-current">
                  <span>剩余时间：{formatTimerRemaining(timerRemaining)}</span>
                  <button className="timer-cancel-btn" onClick={cancelSleepTimer}>
                    取消定时
                  </button>
                </div>
              )}
              <div className="timer-presets">
                <button onClick={() => startSleepTimer(15)}>15 分钟</button>
                <button onClick={() => startSleepTimer(30)}>30 分钟</button>
                <button onClick={() => startSleepTimer(45)}>45 分钟</button>
                <button onClick={() => startSleepTimer(60)}>1 小时</button>
                <button onClick={() => startSleepTimer(90)}>1.5 小时</button>
                <button onClick={() => startSleepTimer(120)}>2 小时</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EQ Panel */}
      {showEQ && (
        <aside className="eq-panel">
          <div className="eq-header">
            <h3>均衡器</h3>
            <div className="eq-header-actions">
              <button 
                className={`eq-toggle ${eqSettings.enabled ? 'active' : ''}`}
                onClick={toggleEQ}
              >
                {eqSettings.enabled ? '开' : '关'}
              </button>
              <button className="eq-close-btn" onClick={() => setShowEQ(false)}>
                <CloseIcon />
              </button>
            </div>
          </div>
          <div className="eq-presets">
            {Object.entries(EQ_PRESETS).map(([id, preset]) => (
              <button
                key={id}
                className={`eq-preset-btn ${eqSettings.preset === id ? 'active' : ''}`}
                onClick={() => applyEQPreset(id)}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className="eq-sliders">
            {EQ_FREQUENCIES.map((freq, index) => (
              <div key={freq} className="eq-slider-group">
                <input
                  type="range"
                  className="eq-slider"
                  min="-12"
                  max="12"
                  step="1"
                  value={eqSettings.values[index]}
                  onChange={(e) => updateEQBand(index, parseInt(e.target.value))}
                  disabled={!eqSettings.enabled}
                />
                <span className="eq-value">{eqSettings.values[index] > 0 ? '+' : ''}{eqSettings.values[index]}</span>
                <span className="eq-freq">{freq >= 1000 ? `${freq/1000}k` : freq}</span>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>设置</h3>
              <button className="modal-close" onClick={() => setShowSettings(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body settings-body">
              {/* Theme Setting */}
              <div className="settings-section">
                <h4>主题</h4>
                <div className="settings-options theme-options">
                  {THEME_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      className={`settings-option ${theme === option.id ? 'active' : ''}`}
                      onClick={() => setTheme(option.id)}
                    >
                      {option.icon === 'moon' && <MoonIcon />}
                      {option.icon === 'sun' && <SunIcon />}
                      {option.icon === 'auto' && <SettingsIcon />}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Quality Setting */}
              <div className="settings-section">
                <h4>音质</h4>
                <div className="settings-options quality-options">
                  {QUALITY_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      className={`settings-option ${audioQuality === option.id ? 'active' : ''}`}
                      onClick={() => setAudioQuality(option.id)}
                    >
                      <HDIcon />
                      <div className="quality-info">
                        <span className="quality-label">{option.label}</span>
                        <span className="quality-bitrate">{option.bitrate}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="settings-hint">切换音质后需重新播放歌曲生效</p>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="settings-section">
                <h4>快捷键</h4>
                <div className="shortcuts-list">
                  <div className="shortcut-item"><kbd>Space</kbd><span>播放/暂停</span></div>
                  <div className="shortcut-item"><kbd>←</kbd><span>快退 5 秒</span></div>
                  <div className="shortcut-item"><kbd>→</kbd><span>快进 5 秒</span></div>
                  <div className="shortcut-item"><kbd>Shift+←</kbd><span>上一首</span></div>
                  <div className="shortcut-item"><kbd>Shift+→</kbd><span>下一首</span></div>
                  <div className="shortcut-item"><kbd>↑/↓</kbd><span>调节音量</span></div>
                  <div className="shortcut-item"><kbd>M</kbd><span>静音切换</span></div>
                  <div className="shortcut-item"><kbd>L</kbd><span>显示歌词</span></div>
                  <div className="shortcut-item"><kbd>Q</kbd><span>播放队列</span></div>
                  <div className="shortcut-item"><kbd>R</kbd><span>单曲循环</span></div>
                  <div className="shortcut-item"><kbd>S</kbd><span>随机播放</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="install-prompt">
          <div className="install-prompt-content">
            <DownloadIcon />
            <div className="install-prompt-text">
              <strong>安装 XingPeng</strong>
              <span>添加到主屏幕，享受更好的体验</span>
            </div>
          </div>
          <div className="install-prompt-actions">
            <button className="install-btn" onClick={handleInstallClick}>
              安装
            </button>
            <button className="install-dismiss" onClick={dismissInstallPrompt}>
              以后再说
            </button>
          </div>
        </div>
      )}

      {/* Lyrics Panel */}
      {showLyrics && currentSong && (
        <aside className="lyrics-panel">
          <div className="lyrics-header">
            <h3>歌词</h3>
            <button className="lyrics-close-btn" onClick={() => setShowLyrics(false)}>×</button>
          </div>
          <div className="lyrics-content" ref={lyricsContainerRef}>
            {lyrics.length > 0 ? (
              lyrics.map((lyric, index) => (
                <div
                  key={index}
                  className={`lyric-line ${index === currentLyricIndex ? 'active' : ''}`}
                  onClick={() => handleLyricClick(lyric.time)}
                >
                  {lyric.text}
                </div>
              ))
            ) : (
              <div className="no-lyrics">暂无歌词</div>
            )}
          </div>
        </aside>
      )}

      {/* Player Bar */}
      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        progress={progress}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isLoading={isLoading}
        isShuffle={isShuffle}
        isRepeat={isRepeat}
        showLyrics={showLyrics}
        showQueue={showQueue}
        showVisualizer={showVisualizer}
        showEQ={showEQ}
        sleepTimer={sleepTimer}
        timerRemaining={timerRemaining}
        onPlayPause={togglePlay}
        onPrev={playPrev}
        onNext={playNext}
        onSeek={(time) => {
          if (audioRef.current) {
            audioRef.current.currentTime = time
          }
        }}
        onVolumeChange={setVolume}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleRepeat={() => setIsRepeat(!isRepeat)}
        onToggleFavorite={(song) => toggleFavorite(song)}
        onToggleLyrics={() => setShowLyrics(!showLyrics)}
        onToggleQueue={() => setShowQueue(!showQueue)}
        onToggleVisualizer={() => setShowVisualizer(!showVisualizer)}
        onToggleEQ={() => setShowEQ(!showEQ)}
        onTimerClick={() => setShowTimerModal(true)}
        onSettingsClick={() => setShowSettings(true)}
        isFavorited={isFavorited}
        canvasRef={canvasRef}
      />

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="mobile-nav">
          {[
            { id: 'home', icon: <HomeIcon />, label: '首页' },
            { id: 'search', icon: <SearchIcon />, label: '搜索' },
            { id: 'library', icon: <LibraryIcon />, label: '收藏' },
            { id: 'playlists', icon: <FolderIcon />, label: '歌单' }
          ].map(item => (
            <button
              key={item.id}
              className={`mobile-nav-item ${activeView === item.id ? 'active' : ''}`}
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
      )}

      {/* Full Screen Player (Mobile) */}
      {showFullPlayer && currentSong && (
        <div
          className="full-player"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="full-player-header">
            <button
              className="full-player-close"
              onClick={() => setShowFullPlayer(false)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
              </svg>
            </button>
            <span className="full-player-title">正在播放</span>
            <button
              className="full-player-action"
              onClick={() => setShowLyrics(!showLyrics)}
            >
              <LyricsIcon />
            </button>
          </div>

          <div className="full-player-content">
            {showLyrics && lyrics.length > 0 ? (
              <div className="full-player-lyrics" ref={lyricsContainerRef}>
                {lyrics.map((lyric, index) => (
                  <div
                    key={index}
                    className={`full-lyric-line ${index === currentLyricIndex ? 'active' : ''}`}
                    onClick={() => handleLyricClick(lyric.time)}
                  >
                    {lyric.text}
                  </div>
                ))}
              </div>
            ) : (
              <div className="full-player-cover-container">
                <img
                  src={currentSong.pic}
                  alt={currentSong.name}
                  className={`full-player-cover ${isPlaying ? 'spinning' : ''}`}
                  onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
                />
              </div>
            )}

            <div className="full-player-info">
              <h2 className="full-player-song-name">{currentSong.name}</h2>
              <p className="full-player-artist">{currentSong.artist}</p>
            </div>

            <div className="full-player-progress">
              <div className="progress-container" onClick={handleProgressClick}>
                <div className="progress-bg" />
                <div className="progress-bar" style={{ width: `${progress}%` }} />
                <div className="progress-handle" style={{ left: `${progress}%` }} />
              </div>
              <div className="progress-times">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="full-player-controls">
              <button
                className={`full-control-btn ${isShuffle ? 'active' : ''}`}
                onClick={() => setIsShuffle(!isShuffle)}
              >
                <ShuffleIcon />
              </button>
              <button className="full-control-btn" onClick={playPrev}>
                <PrevIcon />
              </button>
              <button
                className={`full-control-btn play ${isLoading ? 'loading' : ''}`}
                onClick={togglePlay}
              >
                {isLoading ? (
                  <div className="btn-spinner" />
                ) : isPlaying ? (
                  <PauseIcon />
                ) : (
                  <PlayIcon />
                )}
              </button>
              <button className="full-control-btn" onClick={playNext}>
                <NextIcon />
              </button>
              <button
                className={`full-control-btn ${isRepeat ? 'active' : ''}`}
                onClick={() => setIsRepeat(!isRepeat)}
              >
                <RepeatIcon />
              </button>
            </div>

            <div className="full-player-actions">
              <button
                className={`full-action-btn ${isFavorited(currentSong.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(currentSong)}
              >
                <HeartIcon filled={isFavorited(currentSong.id)} />
              </button>
            </div>

            <p className="swipe-hint">← 左右滑动切换歌曲 →</p>
          </div>
        </div>
      )}

      {/* Mobile Mini Player (clickable to expand) */}
      {isMobile && currentSong && !showFullPlayer && (
        <div
          className="mobile-mini-player"
          onClick={() => setShowFullPlayer(true)}
        >
          <img
            src={currentSong.pic}
            alt={currentSong.name}
            className="mini-player-cover"
            onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
          />
          <div className="mini-player-info">
            <span className="mini-player-name">{currentSong.name}</span>
            <span className="mini-player-artist">{currentSong.artist}</span>
          </div>
          <button
            className="mini-player-btn"
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            className="mini-player-btn"
            onClick={(e) => {
              e.stopPropagation()
              playNext()
            }}
          >
            <NextIcon />
          </button>
          <div className="mini-player-progress" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}

export default App
