import {
  MusicNoteIcon,
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  HistoryIcon,
  FolderIcon
} from './icons'

const Sidebar = ({ activeView, onViewChange, currentSong }) => {
  // Sidebar navigation items
  const navItems = [
    { id: 'home', icon: <HomeIcon />, label: '发现音乐' },
    { id: 'search', icon: <SearchIcon />, label: '搜索' },
    { id: 'library', icon: <LibraryIcon />, label: '我的收藏' },
    { id: 'history', icon: <HistoryIcon />, label: '播放历史' },
    { id: 'playlists', icon: <FolderIcon />, label: '我的歌单' }
  ]

  return (
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
            onClick={() => onViewChange(item.id)}
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
  )
}

export default Sidebar
