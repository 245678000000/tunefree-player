// TuneHub API Service
// API 文档: https://api.tunefree.fun/
// 实际 Base URL: https://music-dl.sayqz.com

const BASE_URL = 'https://music-dl.sayqz.com'

// 支持的音乐平台
export const SOURCES = {
  NETEASE: 'netease',  // 网易云音乐
  KUWO: 'kuwo',        // 酷我音乐
  QQ: 'qq'             // QQ音乐
}

// 请求类型
export const REQUEST_TYPES = {
  SEARCH: 'search',           // 搜索歌曲
  AGG_SEARCH: 'aggregateSearch', // 聚合搜索
  INFO: 'info',               // 获取歌曲详情
  URL: 'url',                 // 获取播放链接
  PIC: 'pic',                 // 获取封面图片
  LRC: 'lrc',                 // 获取歌词
  PLAYLIST: 'playlist',       // 获取歌单详情
  TOPLISTS: 'toplists',       // 获取排行榜列表
  TOPLIST: 'toplist'          // 获取排行榜歌曲
}

/**
 * 构建API请求URL
 * @param {string} type - 请求类型
 * @param {object} params - 其他参数
 * @returns {string} 完整的API URL
 */
function buildUrl(type, params = {}) {
  const queryParams = new URLSearchParams({
    type,
    ...params
  })
  return `${BASE_URL}/api/?${queryParams.toString()}`
}

/**
 * 通用 fetch 函数
 */
async function fetchApi(url, options = {}) {
  try {
    const response = await fetch(url, options)
    return response
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

/**
 * 搜索歌曲
 * @param {string} keyword - 搜索关键词
 * @param {string} source - 音乐平台，默认 netease
 * @param {number} limit - 返回数量限制，默认 20
 * @returns {Promise} 搜索结果
 */
export async function searchSongs(keyword, source = SOURCES.NETEASE, limit = 20) {
  try {
    const url = buildUrl(REQUEST_TYPES.SEARCH, {
      source,
      keyword,
      limit
    })
    console.log('搜索URL:', url)
    const response = await fetchApi(url)
    const data = await response.json()
    console.log('搜索结果:', data)
    return data
  } catch (error) {
    console.error('搜索失败:', error)
    throw error
  }
}

/**
 * 聚合搜索 - 同时搜索所有平台
 * @param {string} keyword - 搜索关键词
 * @returns {Promise} 搜索结果
 */
export async function aggregateSearch(keyword) {
  try {
    const url = buildUrl(REQUEST_TYPES.AGG_SEARCH, { keyword })
    console.log('聚合搜索URL:', url)
    const response = await fetchApi(url)
    const data = await response.json()
    console.log('聚合搜索结果:', data)
    return data
  } catch (error) {
    console.error('聚合搜索失败:', error)
    throw error
  }
}

/**
 * 获取歌曲详情
 * @param {string} id - 歌曲ID
 * @param {string} source - 音乐平台，默认 netease
 * @returns {Promise} 歌曲详情
 */
export async function getSongInfo(id, source = SOURCES.NETEASE) {
  try {
    const url = buildUrl(REQUEST_TYPES.INFO, { source, id })
    const response = await fetchApi(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取歌曲详情失败:', error)
    throw error
  }
}

/**
 * 获取歌曲播放链接
 * @param {string} id - 歌曲ID
 * @param {string} source - 音乐平台，默认 netease
 * @param {string} br - 音质，默认 320k
 * @returns {Promise} 播放链接URL
 */
export async function getSongUrl(id, source = SOURCES.NETEASE, br = '320k') {
  // 直接返回API URL，浏览器会自动处理302重定向
  return `${BASE_URL}/api/?source=${source}&id=${id}&type=url&br=${br}`
}

/**
 * 获取歌曲封面图片
 * @param {string} id - 歌曲ID
 * @param {string} source - 音乐平台，默认 netease
 * @returns {string} 封面图片URL
 */
export function getSongPic(id, source = SOURCES.NETEASE) {
  return `${BASE_URL}/api/?source=${source}&id=${id}&type=pic`
}

/**
 * 获取歌曲歌词
 * @param {string} id - 歌曲ID
 * @param {string} source - 音乐平台，默认 netease
 * @returns {Promise} 歌词文本
 */
export async function getSongLyrics(id, source = SOURCES.NETEASE) {
  try {
    const url = buildUrl(REQUEST_TYPES.LRC, { source, id })
    const response = await fetchApi(url)
    const text = await response.text()
    return text
  } catch (error) {
    console.error('获取歌词失败:', error)
    throw error
  }
}

/**
 * 解析LRC格式歌词
 * @param {string} lrcText - LRC格式歌词文本
 * @returns {Array} 解析后的歌词数组 [{time: seconds, text: '歌词'}]
 */
export function parseLyrics(lrcText) {
  if (!lrcText) return []

  const lines = lrcText.split('\n')
  const lyrics = []
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/

  for (const line of lines) {
    const match = line.match(timeRegex)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = parseInt(match[3].padEnd(3, '0'))
      const time = minutes * 60 + seconds + milliseconds / 1000
      const text = match[4].trim()
      if (text) {
        lyrics.push({ time, text })
      }
    }
  }

  return lyrics
}

/**
 * 获取排行榜列表
 * @param {string} source - 音乐平台，默认 netease
 * @returns {Promise} 排行榜列表
 */
export async function getTopLists(source = SOURCES.NETEASE) {
  try {
    const url = buildUrl(REQUEST_TYPES.TOPLISTS, { source })
    const response = await fetchApi(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取排行榜列表失败:', error)
    throw error
  }
}

/**
 * 获取排行榜歌曲
 * @param {string} id - 排行榜ID
 * @param {string} source - 音乐平台，默认 netease
 * @returns {Promise} 排行榜歌曲
 */
export async function getTopList(id, source = SOURCES.NETEASE) {
  try {
    const url = buildUrl(REQUEST_TYPES.TOPLIST, { source, id })
    const response = await fetchApi(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取排行榜歌曲失败:', error)
    throw error
  }
}

/**
 * 获取歌单详情
 * @param {string} id - 歌单ID
 * @param {string} source - 音乐平台，默认 netease
 * @returns {Promise} 歌单详情
 */
export async function getPlaylist(id, source = SOURCES.NETEASE) {
  try {
    const url = buildUrl(REQUEST_TYPES.PLAYLIST, { source, id })
    const response = await fetchApi(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取歌单失败:', error)
    throw error
  }
}

// 推荐热门歌曲列表
export const RECOMMENDED_SONGS = [
  { id: '186016', name: '晴天', artist: '周杰伦', album: '叶惠美', source: 'netease' },
  { id: '347230', name: '七里香', artist: '周杰伦', album: '七里香', source: 'netease' },
  { id: '139470', name: '夜曲', artist: '周杰伦', album: '十一月的萧邦', source: 'netease' },
  { id: '28949129', name: '告白气球', artist: '周杰伦', album: '周杰伦的床边故事', source: 'netease' },
  { id: '108419', name: '稻香', artist: '周杰伦', album: '魔杰座', source: 'netease' },
  { id: '287016', name: '青花瓷', artist: '周杰伦', album: '我很忙', source: 'netease' },
  { id: '277341', name: '安静', artist: '周杰伦', album: '范特西Plus', source: 'netease' },
  { id: '409654891', name: '起风了', artist: '买辣椒也用券', album: '起风了', source: 'netease' },
  { id: '28758016', name: '演员', artist: '薛之谦', album: '绅士', source: 'netease' },
  { id: '1901371647', name: '孤勇者', artist: '陈奕迅', album: '孤勇者', source: 'netease' },
  { id: '1974443814', name: '我记得', artist: '赵雷', album: '我记得', source: 'netease' },
  { id: '1313354324', name: '错位时空', artist: '艾辰', album: '错位时空', source: 'netease' }
]

// 默认导出所有API
export default {
  searchSongs,
  aggregateSearch,
  getSongInfo,
  getSongUrl,
  getSongPic,
  getSongLyrics,
  parseLyrics,
  getTopLists,
  getTopList,
  getPlaylist,
  SOURCES,
  REQUEST_TYPES,
  RECOMMENDED_SONGS
}
