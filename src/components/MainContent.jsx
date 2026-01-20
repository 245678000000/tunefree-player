import {
  SearchIcon,
  PlayIcon,
  PauseIcon,
  HistoryIcon,
  CloseIcon,
  ChartIcon,
  AddIcon,
  FolderIcon,
  EditIcon,
  DeleteIcon,
  HeartIcon,
  MusicNoteIcon
} from './icons'
import { getSongPic, RECOMMENDED_SONGS } from '../api/tunehub'

const MainContent = ({
  // View State
  activeView,
  currentView,
  
  // Search State
  searchQuery,
  setSearchQuery,
  isSearching,
  searchError,
  searchResults,
  showSearchSuggestions,
  setShowSearchSuggestions,
  searchHistory,
  searchSource,
  setSearchSource,
  
  // Search Handlers
  handleSearch,
  clearSearchHistory,
  removeFromSearchHistory,
  useSearchSuggestion,
  
  // Data State
  currentSong,
  isPlaying,
  favorites,
  playHistory,
  userPlaylists,
  currentPlaylist,
  
  // UI State
  showLyrics,
  showAddToPlaylist,
  setShowAddToPlaylist,
  
  // Actions
  setPlaylist,
  playSong,
  playAllRecommended,
  toggleFavorite,
  clearHistory,
  removeFromHistory,
  openCreatePlaylist,
  openEditPlaylist,
  deletePlaylist,
  viewPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist
}) => {
  
  const sourceTabs = [
    { id: 'all', label: '全部' },
    { id: 'netease', label: '网易云' },
    { id: 'kuwo', label: '酷我' },
    { id: 'qq', label: 'QQ' }
  ]

  return (
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
  )
}

export default MainContent
