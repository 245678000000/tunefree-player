import { useState, useEffect } from 'react'
import { getSongLyrics, parseLyrics } from '../api/tunehub'

export const useLyrics = (currentSong, currentTime) => {
  const [lyrics, setLyrics] = useState([])
  const [showLyrics, setShowLyrics] = useState(false)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)

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
  }, [currentSong?.id, currentSong?.source])

  // Sync lyrics with current time
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

  const toggleLyrics = () => setShowLyrics(prev => !prev)

  return {
    lyrics,
    showLyrics,
    currentLyricIndex,
    setShowLyrics,
    toggleLyrics
  }
}
