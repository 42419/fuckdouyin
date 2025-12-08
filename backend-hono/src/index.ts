import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { D1Database, KVNamespace } from '@cloudflare/workers-types'

type Env = {
  DB: D1Database
  AUTH_KV: KVNamespace
}

type AuthUser = {
  id: string
  email: string
  username?: string
  avatar?: string
}

type Vars = {
  authUser: AuthUser
  authToken: string
}

type Announcement = {
  id: string
  title: string
  content: string
  startTime: number // timestamp
  endTime: number // timestamp
  isActive: boolean
}

const app = new Hono<{ Bindings: Env; Variables: Vars }>()

const isHashedPassword = (value: string) => /^[0-9a-f]{64}$/i.test(value)

const hashPassword = async (password: string): Promise<string> => {
  const data = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const verifyPassword = async (plain: string, stored: string): Promise<boolean> => {
  if (isHashedPassword(stored)) {
    const hashed = await hashPassword(plain)
    return hashed === stored
  }
  // 兼容旧的明文密码
  return plain === stored
}

const ensureUserHistoryTable = async (db: D1Database, userId: string) => {
  const tableName = `history_${userId}`
  // 简单的防注入检查，确保 userId 只包含字母数字
  if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
    throw new Error('Invalid user ID for table creation')
  }

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_url TEXT NOT NULL,
      title TEXT,
      cover_url TEXT,
      author TEXT,
      author_avatar TEXT,
      created_at INTEGER,
      UNIQUE(video_url)
    )
  `).run()
}

// 启用 CORS
app.use('/*', cors())

const requireAuth = async (c: any, next: () => Promise<void>) => {
  const auth = c.req.header('authorization') || ''
  const [scheme, token] = auth.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const sessionJson = await c.env.AUTH_KV.get(`session:${token}`)
  if (!sessionJson) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const session = JSON.parse(sessionJson) as AuthUser

  // 验证用户是否存在于 D1 数据库中
  const user = await c.env.DB.prepare('SELECT id, email, username, avatar FROM users WHERE id = ?')
    .bind(session.id)
    .first() as AuthUser | null

  if (!user) {
    return c.json({ message: 'Unauthorized - User not found' }, 401)
  }

  c.set('authUser', user)
  c.set('authToken', token)
  await next()
}

// 全局鉴权中间件
app.use('/api/*', async (c, next) => {
  // 排除登录接口和公告获取接口
  if (c.req.path === '/api/login' || (c.req.path === '/api/announcement' && c.req.method === 'GET')) {
    await next()
    return
  }
  await requireAuth(c, next)
})

// 根路由
app.get('/', (c) => c.text('Douyin Downloader API (Powered by Hono)'))

/**
 * 短链接重定向接口
 * GET /api/redirect?url=https://v.douyin.com/xxx/
 */
app.get('/api/redirect', async (c) => {
  const url = c.req.query('url')
  if (!url) {
    return c.json({ error: 'Missing URL parameter' }, 400)
  }

  try {
    // 使用 fetch 的 redirect: 'follow' 自动跟随重定向
    // 注意：在 Cloudflare Workers 中，fetch 会自动处理重定向
    const response = await fetch(url, {
      method: 'HEAD', // 尝试使用 HEAD 请求减少流量
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    // 如果 HEAD 请求失败（有些服务器不支持），回退到 GET
    if (response.status >= 400) {
        const getResponse = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })
        return c.json({ 
            url: getResponse.url, 
            success: true, 
            method: 'GET_follow' 
        })
    }

    return c.json({ 
      url: response.url, 
      success: true, 
      method: 'HEAD_follow' 
    })

  } catch (e) {
    return c.json({ error: String(e), success: false }, 500)
  }
})

/**
 * 聚合解析接口 (BFF模式)
 * GET /api/analysis?url=https://v.douyin.com/xxx/
 * 功能：后端处理重定向 + 调用第三方API，减少前端往返延迟
 */
app.get('/api/analysis', async (c) => {
  const url = c.req.query('url')
  if (!url) {
    return c.json({ error: 'Missing URL parameter' }, 400)
  }

  try {
    // 1. 处理重定向获取真实链接
    let finalUrl = url
    let awemeId = ''

    // 尝试获取重定向后的 URL
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    // 如果 HEAD 成功，使用最终 URL
    if (response.status < 400) {
        finalUrl = response.url
    } else {
        // 如果 HEAD 失败，尝试 GET
        const getResponse = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })
        if (getResponse.status < 400) {
            finalUrl = getResponse.url
        }
    }

    // 2. 从最终 URL 中提取 aweme_id
    // 匹配 /video/1234567890...
    const videoIdMatch = finalUrl.match(/\/video\/(\d+)/)
    if (videoIdMatch) {
        awemeId = videoIdMatch[1]
    } else {
        // 尝试从 query 参数中提取 (modal_id 等)
        const urlObj = new URL(finalUrl)
        const modalId = urlObj.searchParams.get('modal_id')
        if (modalId) {
            awemeId = modalId
        }
    }

    if (!awemeId) {
        return c.json({ error: 'Could not extract video ID', finalUrl }, 400)
    }

    // 3. 调用第三方 API 获取视频数据
    const apiUrl = `https://dapi.liyunfei.eu.org/api/douyin/web/fetch_one_video?aweme_id=${awemeId}`
    const apiResponse = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    })

    if (!apiResponse.ok) {
        return c.json({ error: 'Third party API error', status: apiResponse.status }, 502)
    }

    const data = await apiResponse.json()

    // 4. 保存解析历史
    const user = c.get('authUser') as AuthUser
    if (user) {
      // 提取逻辑参考 Flutter 端 VideoModel.fromApi
      const videoDetail = data.data || {}
      let detail = videoDetail
      if (videoDetail.aweme_detail) {
        detail = videoDetail.aweme_detail
      } else if (videoDetail.video && videoDetail.author) {
        detail = videoDetail
      }

      const title = detail.desc || ''
      
      // 提取作者信息
      const authorInfo = detail.author || {}
      const authorName = authorInfo.nickname || ''
      let authorAvatar = ''
      if (authorInfo.avatar_thumb && authorInfo.avatar_thumb.url_list && authorInfo.avatar_thumb.url_list.length > 0) {
        authorAvatar = authorInfo.avatar_thumb.url_list[0]
      }

      // 提取封面
      let cover = ''
      const videoObj = detail.video || {}
      if (videoObj.cover && videoObj.cover.url_list && videoObj.cover.url_list.length > 0) {
        cover = videoObj.cover.url_list[0]
      } else if (videoObj.origin_cover && videoObj.origin_cover.url_list && videoObj.origin_cover.url_list.length > 0) {
        cover = videoObj.origin_cover.url_list[0]
      }

      // 使用 waitUntil 不阻塞响应
      // 使用 INSERT OR REPLACE 来处理重复记录，更新时间戳
      c.executionCtx.waitUntil(
        (async () => {
          await ensureUserHistoryTable(c.env.DB, user.id)
          await c.env.DB.prepare(
            `INSERT INTO history_${user.id} (video_url, title, cover_url, author, author_avatar, created_at) 
             VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
             ON CONFLICT(video_url) DO UPDATE SET 
             created_at = strftime('%s', 'now'),
             title = excluded.title,
             cover_url = excluded.cover_url,
             author = excluded.author,
             author_avatar = excluded.author_avatar`
          )
            .bind(finalUrl, title, cover, authorName, authorAvatar)
            .run()
        })()
      )
    }

    // 5. 返回结果
    return c.json(data)

  } catch (e) {
    return c.json({ error: String(e), success: false }, 500)
  }
})

/**
 * 视频下载代理接口
 * GET /api/download?url=https://...
 */
app.get('/api/download', async (c) => {
  const url = c.req.query('url')
  // 获取文件名参数，如果没有则默认为 video.mp4
  let filename = c.req.query('filename') || 'video.mp4'
  
  // 简单的安全过滤，防止路径遍历等
  filename = filename.replace(/[\/\\:*?"<>|]/g, '_');

  if (!url) {
    return c.text('Missing URL parameter', 400)
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.douyin.com/'
      }
    })

    // 创建新的 Headers 对象以修改响应头
    const newHeaders = new Headers(response.headers)
    
    // 设置 CORS 和下载强制头
    newHeaders.set('Access-Control-Allow-Origin', '*')
    
    // 使用 encodeURIComponent 编码文件名以支持中文
    const encodedFilename = encodeURIComponent(filename);
    // 设置支持中文的文件名头
    newHeaders.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`)
    
    // 移除可能导致问题的头
    newHeaders.delete('Content-Encoding')

    // 直接流式返回响应体
    // @ts-ignore: Hono types mismatch for stream body
    return c.body(response.body, {
      status: response.status,
      headers: newHeaders
    })

  } catch (e) {
    return c.text(`Download Error: ${String(e)}`, 500)
  }
})

/**
 * 简单登录接口
 * POST /api/login
 * body: { email: string, password: string }
 * 返回: { token: string }
 *
 * 说明：
 * - 这里先使用固定账号密码做演示：
 *   email: admin@example.com
 *   password: 123456
 * - 验证通过后返回一个简单的 token（前端只需将其视为不透明字符串）
 */
app.post('/api/login', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>()

  if (!email || !password) {
    return c.json({ message: 'Missing email or password' }, 400)
  }

  const row = await c.env.DB.prepare(
    'SELECT id, email, password, username, avatar FROM users WHERE email = ?'
  )
    .bind(email)
    .first<AuthUser & { password: string }>()

  if (!row || !(await verifyPassword(password, row.password))) {
    return c.json({ message: 'Invalid email or password' }, 401)
  }

  const token = crypto.randomUUID()

  await c.env.AUTH_KV.put(
    `session:${token}`,
    JSON.stringify({ id: row.id, email: row.email }),
    { expirationTtl: 60 * 60 * 24 * 7 }
  )

  return c.json({ token })
})

app.get('/api/me', async (c) => {
  const user = c.get('authUser')
  return c.json({ user })
})

app.post('/api/change_password', async (c) => {
  const { oldPassword, newPassword } = await c.req.json<{
    oldPassword?: string
    newPassword?: string
  }>()

  if (!oldPassword || !newPassword) {
    return c.json({ message: 'Missing password' }, 400)
  }

  if (newPassword.length < 6) {
    return c.json({ message: 'Password too short' }, 400)
  }

  const user = c.get('authUser') as AuthUser

  const row = await c.env.DB.prepare(
    'SELECT id, email, password FROM users WHERE id = ?'
  )
    .bind(user.id)
    .first<AuthUser & { password: string }>()

  if (!row || !(await verifyPassword(oldPassword, row.password))) {
    return c.json({ message: 'Old password incorrect' }, 401)
  }

  const newHashed = await hashPassword(newPassword)

  await c.env.DB.prepare('UPDATE users SET password = ? WHERE id = ?')
    .bind(newHashed, user.id)
    .run()

  return c.json({ success: true })
})

app.post('/api/update_profile', async (c) => {
  const user = c.get('authUser') as AuthUser
  const { username, avatar } = await c.req.json<{ username?: string; avatar?: string }>()

  if (username === undefined && avatar === undefined) {
    return c.json({ message: 'Nothing to update' }, 400)
  }

  let query = 'UPDATE users SET '
  const params: any[] = []
  const updates: string[] = []

  if (username !== undefined) {
    updates.push('username = ?')
    params.push(username)
  }
  if (avatar !== undefined) {
    updates.push('avatar = ?')
    params.push(avatar)
  }

  query += updates.join(', ') + ' WHERE id = ?'
  params.push(user.id)

  await c.env.DB.prepare(query)
    .bind(...params)
    .run()

  return c.json({ success: true })
})

/**
 * 获取解析历史接口
 * GET /api/history?page=1&limit=10
 */
app.get('/api/history', async (c) => {
  const user = c.get('authUser') as AuthUser
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const offset = (page - 1) * limit

  try {
    await ensureUserHistoryTable(c.env.DB, user.id)

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM history_${user.id} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all()

    const totalResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM history_${user.id}`
    )
      .first<{ count: number }>()

    return c.json({
      data: results,
      total: totalResult?.count || 0,
      page,
      limit
    })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

/**
 * 删除单条解析历史
 * DELETE /api/history/:id
 */
app.delete('/api/history/:id', async (c) => {
  const user = c.get('authUser') as AuthUser
  const id = c.req.param('id')

  try {
    await ensureUserHistoryTable(c.env.DB, user.id)
    const result = await c.env.DB.prepare(
      `DELETE FROM history_${user.id} WHERE id = ?`
    )
      .bind(id)
      .run()

    if (result.success) {
      return c.json({ success: true })
    } else {
      return c.json({ error: 'Delete failed' }, 500)
    }
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

/**
 * 清空解析历史
 * DELETE /api/history
 */
app.delete('/api/history', async (c) => {
  const user = c.get('authUser') as AuthUser

  try {
    await ensureUserHistoryTable(c.env.DB, user.id)
    const result = await c.env.DB.prepare(
      `DELETE FROM history_${user.id}`
    )
      .run()

    if (result.success) {
      return c.json({ success: true })
    } else {
      return c.json({ error: 'Delete failed' }, 500)
    }
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

/**
 * 获取当前公告
 * GET /api/announcement
 */
app.get('/api/announcement', async (c) => {
  try {
    // 尝试创建表（如果不存在）- 实际生产中建议通过 migration 管理
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER
      )
    `).run()

    const now = Date.now()
    const announcement = await c.env.DB.prepare(`
      SELECT * FROM announcements 
      WHERE is_active = 1 
      AND start_time <= ? 
      AND end_time >= ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `)
    .bind(now, now)
    .first<any>()

    if (!announcement) {
      return c.json({ message: 'No announcement' }, 404)
    }

    // 转换字段名以匹配前端模型
    return c.json({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      startTime: announcement.start_time,
      endTime: announcement.end_time,
      isActive: Boolean(announcement.is_active)
    })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

/**
 * 获取公告历史列表
 * GET /api/announcements
 */
app.get('/api/announcements', async (c) => {
  // Allow any authenticated user to view history
  // const user = c.get('authUser') as AuthUser
  // if (user.id !== 'u1') {
  //   return c.json({ message: 'Forbidden' }, 403)
  // }

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50'
    ).all<any>()

    const announcements = results.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      startTime: a.start_time,
      endTime: a.end_time,
      isActive: Boolean(a.is_active),
      createdAt: a.created_at
    }))

    return c.json(announcements)
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

/**
 * 发布/更新公告
 * POST /api/announcement
 * body: Announcement
 */
app.post('/api/announcement', async (c) => {
  const user = c.get('authUser') as AuthUser
  if (user.id !== 'u1') {
    return c.json({ message: 'Forbidden' }, 403)
  }

  try {
    const data = await c.req.json<Announcement>()
    
    // 简单验证
    if (!data.title || !data.content || !data.startTime || !data.endTime) {
      return c.json({ message: 'Missing required fields' }, 400)
    }

    const id = data.id || crypto.randomUUID()
    const now = Date.now()

    await c.env.DB.prepare(`
      INSERT INTO announcements (id, title, content, start_time, end_time, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      content = excluded.content,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      is_active = excluded.is_active,
      updated_at = excluded.updated_at
    `)
    .bind(
      id,
      data.title,
      data.content,
      data.startTime,
      data.endTime,
      data.isActive ? 1 : 0,
      now, // created_at (ignored on update)
      now  // updated_at
    )
    .run()

    const announcement: Announcement = {
      id,
      title: data.title,
      content: data.content,
      startTime: data.startTime,
      endTime: data.endTime,
      isActive: data.isActive ?? true
    }
    
    return c.json(announcement)
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// 导出 app，Cloudflare Workers 会自动识别
export default app
