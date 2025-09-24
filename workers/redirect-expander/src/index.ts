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
      if (pathname !== '/expand') {
        return json({ error: 'Not Found' }, 404);
      }

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
    } catch (error: any) {
      return json({ success: false, error: error?.message || String(error) }, 500);
    }
  }
} satisfies ExportedHandler<Env>;


