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
import { useLocalStorage, STORAGE_KEYS, addToHistory } from './hooks/useLocalStorage'

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

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
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

const LyricsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 9h-2v2H9v-2H7V9h2V7h2v2h2v2zm0-4V3.5L18.5 9H13z"/></svg>
)

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
)

const AddIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
)

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
)

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
)

const QueueIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
)

const TimerIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
)

const DragIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
)

const KeyboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>
)

const VisualizerIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="10" width="2" height="4" rx="1" />
    <rect x="8" y="6" width="2" height="12" rx="1" />
    <rect x="12" y="8" width="2" height="8" rx="1" />
    <rect x="16" y="4" width="2" height="16" rx="1" />
    <rect x="20" y="9" width="2" height="6" rx="1" />
  </svg>
)

const EQIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
)

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>
)

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
  </svg>
)

const HDIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9.5v-2h-2v2H6V9h1.5v2.5h2V9H11v6zm2-6h4c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-4V9zm1.5 4.5h2v-3h-2v3z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
  </svg>
)

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

  // Player state
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)

  // Lyrics state
  const [lyrics, setLyrics] = useState([])
  const [showLyrics, setShowLyrics] = useState(false)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)

  // 使用 localStorage 持久化的状态
  const [favorites, setFavorites] = useLocalStorage(STORAGE_KEYS.FAVORITES, [])
  const [playHistory, setPlayHistory] = useLocalStorage(STORAGE_KEYS.PLAY_HISTORY, [])
  const [volume, setVolume] = useLocalStorage(STORAGE_KEYS.VOLUME, 0.7)
  const [userPlaylists, setUserPlaylists] = useLocalStorage(STORAGE_KEYS.PLAYLISTS, [])
  const [lastSong, setLastSong] = useLocalStorage(STORAGE_KEYS.LAST_SONG, null)

  // Playlist management state
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState(null)
  const [playlistName, setPlaylistName] = useState('')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(null)

  // Mobile state
  const [showFullPlayer, setShowFullPlayer] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Queue & Timer state
  const [showQueue, setShowQueue] = useState(false)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [sleepTimer, setSleepTimer] = useState(null)
  const [timerRemaining, setTimerRemaining] = useState(0)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  
  // Search history (persisted)
  const [searchHistory, setSearchHistory] = useLocalStorage(STORAGE_KEYS.SEARCH_HISTORY, [])

  // EQ & Settings state (persisted)
  const [eqSettings, setEqSettings] = useLocalStorage(STORAGE_KEYS.EQ_SETTINGS, {
    preset: 'flat',
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    enabled: true
  })
  const [audioQuality, setAudioQuality] = useLocalStorage(STORAGE_KEYS.AUDIO_QUALITY, 'high')
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, 'dark')
  
  // UI state for EQ and Settings
  const [showEQ, setShowEQ] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  // Audio ref
  const audioRef = useRef(new Audio())
  const lyricsContainerRef = useRef(null)
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
            // Shift + Left: 上一首
            playPrev()
          } else {
            // Left: 快退 5 秒
            if (audioRef.current) {
              audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5)
            }
          }
          break
        case 'ArrowRight':
          if (e.shiftKey) {
            // Shift + Right: 下一首
            playNext()
          } else {
            // Right: 快进 5 秒
            if (audioRef.current) {
              audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5)
            }
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
          // M: 静音切换
          setVolume(prev => prev > 0 ? 0 : 0.7)
          break
        case 'KeyL':
          // L: 显示歌词
          if (currentSong) setShowLyrics(prev => !prev)
          break
        case 'KeyQ':
          // Q: 显示队列
          setShowQueue(prev => !prev)
          break
        case 'KeyR':
          // R: 单曲循环
          setIsRepeat(prev => !prev)
          break
        case 'KeyS':
          // S: 随机播放
          setIsShuffle(prev => !prev)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSong, duration])

  // Sleep timer logic
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
        // 时间到，暂停播放
        setIsPlaying(false)
        setSleepTimer(null)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [sleepTimer])

  // Theme logic
  useEffect(() => {
    const applyTheme = (themeName) => {
      document.documentElement.setAttribute('data-theme', themeName)
    }
    
    if (theme === 'system') {
      // 跟随系统主题
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches ? 'dark' : 'light')
      
      const handler = (e) => applyTheme(e.matches ? 'dark' : 'light')
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      applyTheme(theme)
    }
  }, [theme])

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // 显示安装提示（如果用户还没有安装）
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Handle PWA install
  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('用户接受了安装提示')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  // Dismiss install prompt
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false)
  }

  // Initialize Audio Context with EQ
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) {
      // 如果已存在，确保恢复播放状态
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
      return
    }
    
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      
      // 创建源节点
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)
      
      // 创建分析器
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      
      // 创建 10 频段 EQ 滤波器
      eqFiltersRef.current = EQ_FREQUENCIES.map((freq, index) => {
        const filter = audioContextRef.current.createBiquadFilter()
        filter.type = index === 0 ? 'lowshelf' : index === 9 ? 'highshelf' : 'peaking'
        filter.frequency.value = freq
        filter.Q.value = 1.4
        filter.gain.value = eqSettings.enabled ? eqSettings.values[index] : 0
        return filter
      })
      
      // 连接音频链：source -> EQ filters -> analyser -> destination
      let lastNode = sourceNodeRef.current
      eqFiltersRef.current.forEach(filter => {
        lastNode.connect(filter)
        lastNode = filter
      })
      lastNode.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
      
      // 恢复 AudioContext（浏览器自动播放策略）
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
      
    } catch (e) {
      console.error('Audio context initialization failed:', e)
    }
  }, [eqSettings.enabled, eqSettings.values])

  // Update EQ values when changed
  useEffect(() => {
    if (!eqFiltersRef.current.length) return
    
    eqFiltersRef.current.forEach((filter, index) => {
      const targetGain = eqSettings.enabled ? eqSettings.values[index] : 0
      filter.gain.setValueAtTime(targetGain, audioContextRef.current?.currentTime || 0)
    })
  }, [eqSettings.values, eqSettings.enabled])

  // Apply EQ preset
  const applyEQPreset = (presetId) => {
    const preset = EQ_PRESETS[presetId]
    if (preset) {
      setEqSettings(prev => ({
        ...prev,
        preset: presetId,
        values: [...preset.values]
      }))
    }
  }

  // Update single EQ band
  const updateEQBand = (index, value) => {
    setEqSettings(prev => {
      const newValues = [...prev.values]
      newValues[index] = value
      return {
        ...prev,
        preset: 'custom',
        values: newValues
      }
    })
  }

  // Toggle EQ
  const toggleEQ = () => {
    setEqSettings(prev => ({
      ...prev,
      enabled: !prev.enabled
    }))
  }

  // Audio visualizer
  useEffect(() => {
    if (!showVisualizer || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // 设置 canvas 尺寸
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resizeCanvas()

    // 初始化 Audio Context (如果还没有)
    initAudioContext()

    if (!analyserRef.current) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      analyser.getByteFrequencyData(dataArray)

      // 清除画布
      ctx.clearRect(0, 0, width, height)

      // 绘制频谱
      const barWidth = (width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8

        // 渐变色
        const hue = (i / bufferLength) * 120 + 100 // 绿色到蓝色
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.8)`

        // 绘制圆角条
        const radius = barWidth / 2
        ctx.beginPath()
        ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, radius)
        ctx.fill()

        x += barWidth
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    if (isPlaying) {
      draw()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [showVisualizer, isPlaying, initAudioContext])

  // Touch gesture handlers for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - next song
        playNext()
      } else {
        // Swipe right - previous song
        playPrev()
      }
    }
  }

  // Initialize audio
  useEffect(() => {
    const audio = audioRef.current
    audio.volume = volume

    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100 || 0)
    }
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else {
        playNext()
      }
    }
    const handleCanPlay = () => setIsLoading(false)
    const handleWaiting = () => setIsLoading(true)

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('waiting', handleWaiting)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('waiting', handleWaiting)
      audio.pause()
      audio.src = ''
    }
  }, [isRepeat])

  // Sync volume to audio
  useEffect(() => {
    audioRef.current.volume = volume
  }, [volume])

  // Handle play/pause
  useEffect(() => {
    if (isPlaying && currentSong) {
      // 确保 AudioContext 处于运行状态
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
      audioRef.current.play().catch(e => {
        console.error('播放失败:', e)
        setIsPlaying(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, currentSong])

  // Update current lyric index
  useEffect(() => {
    if (lyrics.length === 0) return
    
    const index = lyrics.findIndex((lyric, i) => {
      const nextLyric = lyrics[i + 1]
      if (!nextLyric) return currentTime >= lyric.time
      return currentTime >= lyric.time && currentTime < nextLyric.time
    })
    
    if (index !== -1 && index !== currentLyricIndex) {
      setCurrentLyricIndex(index)
    }
  }, [currentTime, lyrics, currentLyricIndex])

  // Auto scroll lyrics
  useEffect(() => {
    if (showLyrics && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current
      const activeLine = container.querySelector('.lyric-line.active')
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentLyricIndex, showLyrics])

  // MediaSession API
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.name,
      artist: currentSong.artist,
      album: currentSong.album || '',
      artwork: [
        { src: currentSong.pic, sizes: '96x96', type: 'image/jpeg' },
        { src: currentSong.pic, sizes: '128x128', type: 'image/jpeg' },
        { src: currentSong.pic, sizes: '192x192', type: 'image/jpeg' },
        { src: currentSong.pic, sizes: '256x256', type: 'image/jpeg' },
        { src: currentSong.pic, sizes: '384x384', type: 'image/jpeg' },
        { src: currentSong.pic, sizes: '512x512', type: 'image/jpeg' },
      ]
    })

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true))
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false))
    navigator.mediaSession.setActionHandler('previoustrack', playPrev)
    navigator.mediaSession.setActionHandler('nexttrack', playNext)
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime) {
        audioRef.current.currentTime = details.seekTime
      }
    })
  }, [currentSong])

  // Load lyrics when song changes
  useEffect(() => {
    if (!currentSong) {
      setLyrics([])
      return
    }

    const loadLyrics = async () => {
      try {
        const lrcText = await getSongLyrics(currentSong.id, currentSong.source)
        const parsed = parseLyrics(lrcText)
        setLyrics(parsed)
        setCurrentLyricIndex(0)
    } catch (error) {
        console.error('加载歌词失败:', error)
        setLyrics([])
      }
    }

    loadLyrics()
  }, [currentSong?.id])

  // Search handler
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setShowSearchSuggestions(false)
    handleSearchWithQuery(searchQuery)
  }

  // Play song
  const playSong = async (song, fromPlaylist = false, index = -1) => {
    try {
      setIsLoading(true)
      const source = song.platform || song.source || SOURCES.NETEASE
      // 传入音质参数
      const url = await getSongUrl(song.id, source, audioQuality)
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
      
      // 初始化 Audio Context (首次播放时)
      initAudioContext()
      
      setIsPlaying(true)

      // 保存到播放历史
      setPlayHistory(prev => addToHistory(prev, songData))
      
      // 保存最后播放的歌曲
      setLastSong(songData)

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
  const playNext = useCallback(() => {
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
  }, [playlist, currentIndex, isShuffle])

  // Play previous song
  const playPrev = useCallback(() => {
    if (playlist.length === 0) return

    let prevIndex
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length)
    } else {
      prevIndex = currentIndex - 1 < 0 ? playlist.length - 1 : currentIndex - 1
    }

    playSong(playlist[prevIndex], true, prevIndex)
  }, [playlist, currentIndex, isShuffle])

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
  }

  // Toggle play/pause
  const togglePlay = () => {
    if (!currentSong) return
    setIsPlaying(!isPlaying)
  }

  // Toggle favorite
  const toggleFavorite = (song) => {
    const songData = {
      id: song.id,
      name: song.name,
      artist: song.artist,
      source: song.source
    }
    
    const isFavorited = favorites.some(f => f.id === song.id)
    if (isFavorited) {
      setFavorites(favorites.filter(f => f.id !== song.id))
    } else {
      setFavorites([...favorites, songData])
    }
  }

  // Check if song is favorited
  const isFavorited = (songId) => favorites.some(f => f.id === songId)

  // Play all recommended songs
  const playAllRecommended = () => {
    const songs = RECOMMENDED_SONGS.map(song => ({
      ...song,
      source: song.source || SOURCES.NETEASE
    }))
    setPlaylist(songs)
    playSong(songs[0], true, 0)
  }

  // Remove from history
  const removeFromHistory = (songId) => {
    setPlayHistory(playHistory.filter(s => s.id !== songId))
  }

  // Clear all history
  const clearHistory = () => {
    setPlayHistory([])
  }

  // Handle lyric click (seek to time)
  const handleLyricClick = (time) => {
    audioRef.current.currentTime = time
  }

  // ===== Playlist Management Functions =====
  
  // Create new playlist
  const createPlaylist = () => {
    if (!playlistName.trim()) return
    
    const newPlaylist = {
      id: `playlist_${Date.now()}`,
      name: playlistName.trim(),
      songs: [],
      createdAt: Date.now()
    }
    
    setUserPlaylists([...userPlaylists, newPlaylist])
    setPlaylistName('')
    setShowPlaylistModal(false)
  }

  // Update playlist name
  const updatePlaylist = () => {
    if (!playlistName.trim() || !editingPlaylist) return
    
    setUserPlaylists(userPlaylists.map(pl => 
      pl.id === editingPlaylist.id 
        ? { ...pl, name: playlistName.trim() }
        : pl
    ))
    setPlaylistName('')
    setEditingPlaylist(null)
    setShowPlaylistModal(false)
  }

  // Delete playlist
  const deletePlaylist = (playlistId) => {
    setUserPlaylists(userPlaylists.filter(pl => pl.id !== playlistId))
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null)
      setCurrentView('home')
      setActiveView('home')
    }
  }

  // Add song to playlist
  const addSongToPlaylist = (playlistId, song) => {
    const songData = {
      id: song.id,
      name: song.name || song.title,
      artist: song.artist || song.singer || song.ar?.[0]?.name || '未知歌手',
      source: song.platform || song.source || SOURCES.NETEASE
    }
    
    setUserPlaylists(userPlaylists.map(pl => {
      if (pl.id === playlistId) {
        // Check if song already exists
        if (pl.songs.some(s => s.id === songData.id)) {
          return pl
        }
        return { ...pl, songs: [...pl.songs, songData] }
      }
      return pl
    }))
    setShowAddToPlaylist(null)
  }

  // Remove song from playlist
  const removeSongFromPlaylist = (playlistId, songId) => {
    setUserPlaylists(userPlaylists.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, songs: pl.songs.filter(s => s.id !== songId) }
      }
      return pl
    }))
  }

  // Open edit playlist modal
  const openEditPlaylist = (playlist) => {
    setEditingPlaylist(playlist)
    setPlaylistName(playlist.name)
    setShowPlaylistModal(true)
  }

  // Open create playlist modal
  const openCreatePlaylist = () => {
    setEditingPlaylist(null)
    setPlaylistName('')
    setShowPlaylistModal(true)
  }

  // View playlist
  const viewPlaylist = (playlist) => {
    setSelectedPlaylistId(playlist.id)
    setCurrentView('playlist')
    setActiveView('playlists')
  }

  // Get current selected playlist
  const currentPlaylist = userPlaylists.find(pl => pl.id === selectedPlaylistId)

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

  // Format timer remaining
  const formatTimerRemaining = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Sidebar navigation items
  const navItems = [
    { id: 'home', icon: <HomeIcon />, label: '发现音乐' },
    { id: 'search', icon: <SearchIcon />, label: '搜索' },
    { id: 'library', icon: <LibraryIcon />, label: '我的收藏' },
    { id: 'history', icon: <HistoryIcon />, label: '播放历史' },
    { id: 'playlists', icon: <FolderIcon />, label: '我的歌单' }
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
      <main className={`main-content ${showLyrics ? 'with-lyrics' : ''}`}>
        {/* Search Bar */}
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
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              />
              {/* Search History Dropdown */}
              {showSearchSuggestions && searchHistory.length > 0 && (
                <div className="search-history-dropdown">
                  <div className="search-history-header">
                    <span>搜索历史</span>
                    <button
                      type="button"
                      className="clear-history-btn"
                      onClick={(e) => {
                        e.preventDefault()
                        clearSearchHistory()
                      }}
                    >
                      清空
                    </button>
                  </div>
                  {searchHistory.map((query, index) => (
                    <div
                      key={index}
                      className="search-history-item"
                      onClick={() => useSearchSuggestion(query)}
                    >
                      <HistoryIcon />
                      <span>{query}</span>
                      <button
                        type="button"
                        className="remove-history-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromSearchHistory(query)
                        }}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                        <div className="song-actions">
                          <button
                            className="song-action-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowAddToPlaylist(showAddToPlaylist === song.id ? null : song.id)
                            }}
                            title="添加到歌单"
                          >
                            <AddIcon />
                          </button>
                          {showAddToPlaylist === song.id && (
                            <div className="add-to-playlist-dropdown">
                              {userPlaylists.length > 0 ? (
                                userPlaylists.map(pl => (
                                  <button
                                    key={pl.id}
                                    className="dropdown-item"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      addSongToPlaylist(pl.id, song)
                                    }}
                                  >
                                    <FolderIcon />
                                    <span>{pl.name}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="dropdown-empty">暂无歌单</div>
                              )}
                              <button
                                className="dropdown-item create-new"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowAddToPlaylist(null)
                                  openCreatePlaylist()
                                }}
                              >
                                <AddIcon />
                                <span>创建新歌单</span>
                              </button>
                    </div>
                          )}
                          <button
                            className="song-action-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPlaylist(searchResults)
                              playSong(song, true, index)
                            }}
                          >
                            {currentSong?.id === song.id && isPlaying ? <PauseIcon /> : <PlayIcon />}
                          </button>
                    </div>
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
              {favorites.length > 0 ? (
                <div className="search-results">
                  <div className="results-header">
                    <span className="results-count">{favorites.length} 首收藏</span>
                    <button
                      className="play-all-btn small"
                      onClick={() => {
                        setPlaylist(favorites)
                        playSong(favorites[0], true, 0)
                      }}
                    >
                      <PlayIcon />
                      <span>播放全部</span>
                    </button>
                  </div>
                  <div className="song-list">
                    {favorites.map((song, index) => (
                      <div
                        key={song.id}
                        className={`song-item ${currentSong?.id === song.id ? 'playing' : ''}`}
                        onClick={() => {
                          setPlaylist(favorites)
                          playSong(song, true, index)
                        }}
                      >
                        <span className="song-index">{index + 1}</span>
                        <img
                          src={getSongPic(song.id, song.source)}
                          alt={song.name}
                          className="song-cover"
                          onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
                        />
                        <div className="song-info">
                          <span className="song-name">{song.name}</span>
                          <span className="song-artist">{song.artist}</span>
                        </div>
                        <button
                          className="song-action-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(song)
                          }}
                          title="取消收藏"
                        >
                          <HeartIcon filled={true} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
          <div className="empty-state">
                  <div className="empty-icon">
                    <HeartIcon filled={false} />
                  </div>
            <h3>暂无收藏</h3>
                  <p>播放歌曲时点击爱心即可收藏</p>
          </div>
        )}
            </div>
          )}

          {currentView === 'history' && (
            <div className="history-view">
              <div className="section-header">
                <h2 className="view-title">播放历史</h2>
                {playHistory.length > 0 && (
                  <button className="clear-btn" onClick={clearHistory}>
                    清空历史
                  </button>
                )}
              </div>
              {playHistory.length > 0 ? (
                <div className="song-list">
                  {playHistory.map((song, index) => (
                    <div
                      key={`${song.id}-${index}`}
                      className={`song-item ${currentSong?.id === song.id ? 'playing' : ''}`}
                      onClick={() => {
                        setPlaylist(playHistory)
                        playSong(song, true, index)
                      }}
                    >
                      <span className="song-index">{index + 1}</span>
                      <img
                        src={getSongPic(song.id, song.source)}
                        alt={song.name}
                        className="song-cover"
                        onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
                      />
                      <div className="song-info">
                        <span className="song-name">{song.name}</span>
                        <span className="song-artist">{song.artist}</span>
                      </div>
                      <button
                        className="song-action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromHistory(song.id)
                        }}
                        title="删除"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <HistoryIcon />
                  </div>
                  <h3>暂无播放历史</h3>
                  <p>播放的歌曲将会显示在这里</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'playlists' && (
            <div className="playlists-view">
              <div className="section-header">
                <h2 className="view-title">我的歌单</h2>
                <button className="play-all-btn" onClick={openCreatePlaylist}>
                  <AddIcon />
                  <span>创建歌单</span>
                </button>
              </div>
              {userPlaylists.length > 0 ? (
                <div className="playlists-grid">
                  {userPlaylists.map(pl => (
                    <div
                      key={pl.id}
                      className="playlist-card"
                      onClick={() => viewPlaylist(pl)}
                    >
                      <div className="playlist-card-cover">
                        {pl.songs.length > 0 ? (
                          <img
                            src={getSongPic(pl.songs[0].id, pl.songs[0].source)}
                            alt={pl.name}
                            onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
                          />
                        ) : (
                          <div className="playlist-empty-cover">
                            <FolderIcon />
                          </div>
                        )}
                        <div className="playlist-card-actions">
                          <button
                            className="playlist-card-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditPlaylist(pl)
                            }}
                            title="编辑"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className="playlist-card-btn delete"
                            onClick={(e) => {
                              e.stopPropagation()
                              deletePlaylist(pl.id)
                            }}
                            title="删除"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </div>
                      <div className="playlist-card-info">
                        <div className="playlist-card-name">{pl.name}</div>
                        <div className="playlist-card-count">{pl.songs.length} 首歌曲</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FolderIcon />
                  </div>
                  <h3>暂无歌单</h3>
                  <p>创建你的第一个歌单吧</p>
                  <button className="create-playlist-btn" onClick={openCreatePlaylist}>
                    <AddIcon />
                    <span>创建歌单</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {currentView === 'playlist' && currentPlaylist && (
            <div className="playlist-detail-view">
              <div className="playlist-header">
                <div className="playlist-cover-large">
                  {currentPlaylist.songs.length > 0 ? (
                    <img
                      src={getSongPic(currentPlaylist.songs[0].id, currentPlaylist.songs[0].source)}
                      alt={currentPlaylist.name}
                      onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
                    />
                  ) : (
                    <div className="playlist-empty-cover large">
                      <FolderIcon />
                    </div>
                  )}
                </div>
                <div className="playlist-info">
                  <span className="playlist-label">歌单</span>
                  <h1 className="playlist-name">{currentPlaylist.name}</h1>
                  <span className="playlist-meta">{currentPlaylist.songs.length} 首歌曲</span>
                  <div className="playlist-actions">
                    {currentPlaylist.songs.length > 0 && (
                      <button
                        className="play-all-btn large"
                        onClick={() => {
                          setPlaylist(currentPlaylist.songs)
                          playSong(currentPlaylist.songs[0], true, 0)
                        }}
                      >
                        <PlayIcon />
                        <span>播放全部</span>
                      </button>
                    )}
                    <button
                      className="icon-btn"
                      onClick={() => openEditPlaylist(currentPlaylist)}
                      title="编辑歌单"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => deletePlaylist(currentPlaylist.id)}
                      title="删除歌单"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              </div>
              {currentPlaylist.songs.length > 0 ? (
                <div className="song-list">
                  {currentPlaylist.songs.map((song, index) => (
                    <div
                      key={song.id}
                      className={`song-item ${currentSong?.id === song.id ? 'playing' : ''}`}
                      onClick={() => {
                        setPlaylist(currentPlaylist.songs)
                        playSong(song, true, index)
                      }}
                    >
                      <span className="song-index">{index + 1}</span>
                      <img
                        src={getSongPic(song.id, song.source)}
                        alt={song.name}
                        className="song-cover"
                        onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="40">♪</text></svg>' }}
                      />
                      <div className="song-info">
                        <span className="song-name">{song.name}</span>
                        <span className="song-artist">{song.artist}</span>
                      </div>
                      <button
                        className="song-action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSongFromPlaylist(currentPlaylist.id, song.id)
                        }}
                        title="从歌单移除"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <MusicNoteIcon />
                  </div>
                  <h3>歌单是空的</h3>
                  <p>搜索歌曲并添加到这个歌单</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

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
                className={`player-like-btn ${isFavorited(currentSong.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(currentSong)}
              >
                <HeartIcon filled={isFavorited(currentSong.id)} />
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
          {showVisualizer && (
            <canvas ref={canvasRef} className="audio-visualizer" />
          )}
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

        {/* Right - Volume & Lyrics */}
        <div className="player-right">
          <button
            className={`player-control-btn ${showQueue ? 'active' : ''}`}
            onClick={() => setShowQueue(!showQueue)}
            title="播放队列 (Q)"
          >
            <QueueIcon />
          </button>
          <button
            className={`player-control-btn ${sleepTimer ? 'active timer-active' : ''}`}
            onClick={() => setShowTimerModal(true)}
            title="睡眠定时器"
          >
            <TimerIcon />
            {sleepTimer && (
              <span className="timer-badge">{formatTimerRemaining(timerRemaining)}</span>
            )}
          </button>
          <button
            className={`player-control-btn ${showEQ ? 'active' : ''}`}
            onClick={() => setShowEQ(!showEQ)}
            title="均衡器"
          >
            <EQIcon />
          </button>
          <button
            className={`player-control-btn ${showVisualizer ? 'active' : ''}`}
            onClick={() => setShowVisualizer(!showVisualizer)}
            title="可视化"
          >
            <VisualizerIcon />
          </button>
          <button
            className={`player-control-btn ${showLyrics ? 'active' : ''}`}
            onClick={() => setShowLyrics(!showLyrics)}
            title="歌词 (L)"
          >
            <LyricsIcon />
          </button>
          <button
            className="player-control-btn"
            onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
            title="静音 (M)"
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
          <button
            className="player-control-btn"
            onClick={() => setShowSettings(true)}
            title="设置"
          >
            <SettingsIcon />
          </button>
        </div>
      </footer>

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
