import { useState, useEffect } from 'react'

/**
 * 自定义 Hook：将状态同步到 localStorage
 * @param {string} key - localStorage 的键名
 * @param {any} initialValue - 初始值
 * @returns {[any, Function]} - [值, 设置函数]
 */
export function useLocalStorage(key, initialValue) {
  // 从 localStorage 获取初始值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // 当值变化时同步到 localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}



/**
 * 添加到播放历史（最多保留 50 首）
 */
export function addToHistory(history, song, maxItems = 50) {
  if (!song || !song.id) return history
  
  // 移除重复项
  const filtered = history.filter(item => item.id !== song.id)
  
  // 添加到开头
  const newHistory = [
    {
      id: song.id,
      name: song.name,
      artist: song.artist,
      source: song.source,
      playedAt: Date.now()
    },
    ...filtered
  ]
  
  // 限制数量
  return newHistory.slice(0, maxItems)
}

export default useLocalStorage
