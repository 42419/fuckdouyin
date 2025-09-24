export interface Env {}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type'
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, OPTIONS',
          'access-control-allow-headers': 'content-type'
        }
      });
    }

    try {
      const { searchParams, pathname } = new URL(request.url);

      // 统一接口：/expand?url=<short>
      if (pathname === '/expand') {
        const inputUrl = searchParams.get('url');
        if (!inputUrl) {
          return json({ error: '缺少url参数' }, 400);
        }
        if (!/^https?:\/\//i.test(inputUrl)) {
          return json({ error: '无效的URL格式' }, 400);
        }

        // 尝试 1：HEAD + manual 读取 Location
        let resp = await fetch(inputUrl, {
          method: 'HEAD',
          redirect: 'manual',
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
          }
        });
        let location = resp.headers.get('location');

        // 尝试 2：GET + manual
        if (!location && (resp.status < 300 || resp.status >= 400)) {
          resp = await fetch(inputUrl, {
            method: 'GET',
            redirect: 'manual',
            headers: {
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
              'accept': '*/*'
            }
          });
          location = resp.headers.get('location');
        }

        // 若存在 Location，规范化为绝对 URL
        if (location) {
          let finalUrl = location;
          try {
            finalUrl = new URL(location, inputUrl).toString();
          } catch {}
          return json({ success: true, url: finalUrl, method: 'location_header' });
        }

        // 尝试 3：follow，读取最终 resp.url（不读 body）
        resp = await fetch(inputUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
            'accept': '*/*'
          }
        });
        if (resp.url && resp.url !== inputUrl) {
          return json({ success: true, url: resp.url, method: 'follow_redirect' });
        }

        // 针对抖音短链，直接返回引导
        if (inputUrl.includes('v.douyin.com')) {
          return json({
            success: false,
            url: inputUrl,
            method: 'user_guidance_needed',
            message: '检测到抖音短链接，请在浏览器打开后复制完整地址栏URL再粘贴',
          });
        }

        return json({ success: false, url: inputUrl, method: 'no_redirect_found' });
      } 
      // 新增视频下载接口：/download?url=<video_url>
      else if (pathname === '/download') {
        const videoUrl = searchParams.get('url');
        if (!videoUrl) {
          return json({ error: '缺少视频URL参数' }, 400);
        }

        // 获取视频内容
        const response = await fetch(videoUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.douyin.com/',
            'Accept': '*/*'
          }
        });

        if (!response.ok) {
          return json({ error: `视频请求失败: ${response.status} - ${response.statusText}` }, 500);
        }

        // 获取视频数据和相关信息
        const videoData = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'video/mp4';
        
        // 返回视频数据
        return new Response(videoData, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': videoData.byteLength.toString(),
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
          }
        });
      } 
      // 根路径返回欢迎信息
      else if (pathname === '/') {
        return new Response(`
          <html>
            <head><title>抖音工具 Workers API</title></head>
            <body>
              <h1>抖音工具 Workers API</h1>
              <p>可用的接口:</p>
              <ul>
                <li>/expand?url=[短链接] - 展开短链接</li>
                <li>/download?url=[视频链接] - 下载视频</li>
              </ul>
            </body>
          </html>
        `, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } 
      // 404 Not Found
      else {
        return json({ error: 'Not Found' }, 404);
      }
    } catch (error: any) {
      return json({ success: false, error: error?.message || String(error) }, 500);
    }
  }
};