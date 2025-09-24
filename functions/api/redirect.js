// Cloudflare Functions - 简化且稳健的短链接重定向处理

/**
 * 处理短链接重定向请求
 * @param {Request} request - HTTP请求对象
 * @param {Env} env - 环境变量对象
 * @param {Context} context - 执行上下文
 * @returns {Response} HTTP响应对象
 */
export async function onRequestGet(request, env, context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const urlParams = new URL(request.url).searchParams;
    const inputUrl = urlParams.get('url');

    if (!inputUrl) {
      return new Response(JSON.stringify({ error: '缺少URL参数' }), { status: 400, headers: corsHeaders });
    }
    if (!/^https?:\/\//i.test(inputUrl)) {
      return new Response(JSON.stringify({ error: '无效的URL格式' }), { status: 400, headers: corsHeaders });
    }

    // 首选：HEAD + manual，读取 Location
    let resp = await fetch(inputUrl, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        // 只设置必要UA，避免不被允许的头导致平台错误
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    let location = resp.headers.get('location');

    // 备选：GET + manual
    if (!location && (resp.status < 300 || resp.status >= 400)) {
      resp = await fetch(inputUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        }
      });
      location = resp.headers.get('location');
    }

    // 如果拿到了Location，规范化为绝对URL
    if (location) {
      let finalUrl = location;
      try {
        // 处理相对重定向
        finalUrl = new URL(location, inputUrl).toString();
      } catch {}

      return new Response(JSON.stringify({ url: finalUrl, success: true, method: 'location_header' }), { headers: corsHeaders });
    }

    // 最后备选：跟随重定向，读取最终resp.url（不读取body）
    resp = await fetch(inputUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    if (resp.url && resp.url !== inputUrl) {
      return new Response(JSON.stringify({ url: resp.url, success: true, method: 'follow_redirect' }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ url: inputUrl, success: false, method: 'no_redirect_found' }), { headers: corsHeaders });
  } catch (error) {
    // 确保始终返回JSON，避免平台默认HTML错误页
    return new Response(JSON.stringify({ error: '代理请求失败: ' + (error && error.message ? error.message : String(error)), success: false }), { status: 500, headers: corsHeaders });
  }
}