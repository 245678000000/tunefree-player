import { useState, useRef, useEffect, useCallback } from 'react'
import { getSongUrl, getSongPic, SOURCES } from '../api/tunehub'
import { useLocalStorage, addToHistory } from './useLocalStorage'
import { STORAGE_KEYS } from '../constants'

export const useAudioPlayer = (audioQuality = 'standard') => {
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

  // Persisted state
  const [volume, setVolume] = useLocalStorage(STORAGE_KEYS.VOLUME, 0.7)
  const [playHistory, setPlayHistory] = useLocalStorage(STORAGE_KEYS.PLAY_HISTORY, [])
  const [lastSong, setLastSong] = useLocalStorage(STORAGE_KEYS.LAST_SONG, null)

  // Audio ref
  const audioRef = useRef(new Audio())

  // Initialize audio
  useEffect(() => {
    const audio = audioRef.current
    audio.crossOrigin = "anonymous" // Enable CORS for Web Audio API
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
  }, [isRepeat]) // Depend on isRepeat for the ended handler

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

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

  // Play song logic
  const playSong = async (song, fromPlaylist = false, index = -1) => {
    try {
      setIsLoading(true)
      const source = song.platform || song.source || SOURCES.NETEASE
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
      setIsPlaying(true)

      // Save to history and last song
      setPlayHistory(prev => addToHistory(prev, songData))
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

  // Play next
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
  }, [playlist, currentIndex, isShuffle, audioQuality])

  // Play previous
  const playPrev = useCallback(() => {
    if (playlist.length === 0) return

    let prevIndex
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length)
    } else {
      prevIndex = currentIndex - 1 < 0 ? playlist.length - 1 : currentIndex - 1
    }

    playSong(playlist[prevIndex], true, prevIndex)
  }, [playlist, currentIndex, isShuffle, audioQuality])

  // Toggle play/pause
  const togglePlay = () => {
    if (!currentSong) return
    setIsPlaying(!isPlaying)
  }

  // Seek
  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

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
        seek(details.seekTime)
      }
    })
  }, [currentSong, playNext, playPrev])

  return {
    // State
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

    // Actions
    playSong,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setIsPlaying, // Exposed for special cases (e.g. sleep timer)
    setVolume,
    setPlaylist,
    setCurrentIndex,
    setIsShuffle,
    setIsRepeat,
    setPlayHistory
  }
}
