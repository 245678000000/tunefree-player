import { useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '../constants'
import { SOURCES } from '../api/tunehub'

export const usePlaylistManager = () => {
  // State
  const [userPlaylists, setUserPlaylists] = useLocalStorage(STORAGE_KEYS.PLAYLISTS, [])
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState(null)
  const [playlistName, setPlaylistName] = useState('')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(null)

  // Computed
  const currentPlaylist = userPlaylists.find(pl => pl.id === selectedPlaylistId) || null

  // Create playlist
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

  // Update playlist
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

  // UI Helper: Open Edit Modal
  const openEditPlaylist = (playlist) => {
    setEditingPlaylist(playlist)
    setPlaylistName(playlist.name)
    setShowPlaylistModal(true)
  }

  // UI Helper: Open Create Modal
  const openCreatePlaylist = () => {
    setEditingPlaylist(null)
    setPlaylistName('')
    setShowPlaylistModal(true)
  }

  // UI Helper: View Playlist
  const viewPlaylist = (playlist) => {
    setSelectedPlaylistId(playlist.id)
  }

  return {
    // State
    userPlaylists,
    showPlaylistModal,
    editingPlaylist,
    playlistName,
    selectedPlaylistId,
    showAddToPlaylist,
    currentPlaylist,

    // Setters (if needed directly)
    setShowPlaylistModal,
    setPlaylistName,
    setShowAddToPlaylist,

    // Actions
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    openCreatePlaylist,
    openEditPlaylist,
    viewPlaylist
  }
}
