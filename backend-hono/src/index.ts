import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// 启用 CORS
app.use('/*', cors())

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

// 导出 app，Cloudflare Workers 会自动识别
export default app
