import {
  PlayIcon,
  PauseIcon,
  NextIcon,
  PrevIcon,
  ShuffleIcon,
  RepeatIcon,
  VolumeIcon,
  VolumeMuteIcon,
  HeartIcon,
  QueueIcon,
  TimerIcon,
  VisualizerIcon,
  EQIcon,
  SettingsIcon,
  LyricsIcon
} from './icons'
import { formatTime, formatTimerRemaining } from '../utils/format'

const PlayerBar = ({
  // Playback State
  currentSong,
  isPlaying,
  progress,
  currentTime,
  duration,
  volume,
  isLoading,
  
  // Settings State
  isShuffle,
  isRepeat,
  showLyrics,
  showQueue,
  showVisualizer,
  showEQ,
  sleepTimer,
  timerRemaining,

  // Handlers
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  
  // Toggles
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onToggleLyrics,
  onToggleQueue,
  onToggleVisualizer,
  onToggleEQ,
  
  // Other Actions
  onTimerClick,
  onSettingsClick,
  isFavorited,
  
  // Refs
  canvasRef
}) => {
  
  const handleProgressClick = (e) => {
    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.min(1, Math.max(0, x / rect.width))
    onSeek(percent * duration)
  }

  return (
    <footer className="player-bar">
      {showVisualizer && (
        <canvas ref={canvasRef} className="audio-visualizer" />
      )}
      
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
              onClick={() => onToggleFavorite(currentSong)}
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
            onClick={onToggleShuffle}
            title="随机播放"
          >
            <ShuffleIcon />
          </button>
          <button className="player-control-btn" onClick={onPrev} title="上一首">
            <PrevIcon />
          </button>
          <button
            className={`player-control-btn play-btn ${isLoading ? 'loading' : ''}`}
            onClick={onPlayPause}
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
          <button className="player-control-btn" onClick={onNext} title="下一首">
            <NextIcon />
          </button>
          <button
            className={`player-control-btn ${isRepeat ? 'active' : ''}`}
            onClick={onToggleRepeat}
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

      {/* Right - Volume & Lyrics */}
      <div className="player-right">
        <button
          className={`player-control-btn ${showQueue ? 'active' : ''}`}
          onClick={onToggleQueue}
          title="播放队列 (Q)"
        >
          <QueueIcon />
        </button>
        <button
          className={`player-control-btn ${sleepTimer ? 'active timer-active' : ''}`}
          onClick={onTimerClick}
          title="睡眠定时器"
        >
          <TimerIcon />
          {sleepTimer && (
            <span className="timer-badge">{formatTimerRemaining(timerRemaining)}</span>
          )}
        </button>
        <button
          className={`player-control-btn ${showEQ ? 'active' : ''}`}
          onClick={onToggleEQ}
          title="均衡器"
        >
          <EQIcon />
        </button>
        <button
          className={`player-control-btn ${showVisualizer ? 'active' : ''}`}
          onClick={onToggleVisualizer}
          title="可视化"
        >
          <VisualizerIcon />
        </button>
        <button
          className={`player-control-btn ${showLyrics ? 'active' : ''}`}
          onClick={onToggleLyrics}
          title="歌词 (L)"
        >
          <LyricsIcon />
        </button>
        <button
          className="player-control-btn"
          onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
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
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          />
          <div className="volume-fill" style={{ width: `${volume * 100}%` }} />
        </div>
        <button
          className="player-control-btn"
          onClick={onSettingsClick}
          title="设置"
        >
          <SettingsIcon />
        </button>
      </div>
    </footer>
  )
}

export default PlayerBar
