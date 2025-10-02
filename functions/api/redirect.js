// Cloudflare Functions - 重定向处理（模仿Express.js服务器行为）
export async function onRequestGet(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // 更安全地解析URL参数
    let urlParams;
    try {
      // 检查request.url是否存在且为有效字符串
      if (!request.url || typeof request.url !== 'string') {
        return new Response(JSON.stringify({ 
          error: '请求URL无效: URL不存在或不是字符串',
          success: false 
        }), { status: 400, headers: corsHeaders });
      }
      
      const urlObj = new URL(request.url);
      urlParams = urlObj.searchParams;
    } catch (urlError) {
      return new Response(JSON.stringify({ 
        error: 'URL解析失败: ' + (urlError.message || String(urlError)),
        success: false 
      }), { status: 400, headers: corsHeaders });
    }

    const inputUrl = urlParams.get('url');

    if (!inputUrl) {
      return new Response(JSON.stringify({ 
        error: '缺少URL参数',
        success: false 
      }), { status: 400, headers: corsHeaders });
    }

    // 验证inputUrl是否为有效的URL格式
    try {
      new URL(inputUrl);
    } catch (urlError) {
      return new Response(JSON.stringify({ 
        error: '无效的URL格式: ' + inputUrl,
        success: false 
      }), { status: 400, headers: corsHeaders });
    }

    // 发送请求并跟随重定向直到获取最终URL（模仿Express.js服务器行为）
    let finalUrl = inputUrl;
    let redirectCount = 0;
    const maxRedirects = 10;
    
    while (redirectCount < maxRedirects) {
      try {
        const response = await fetch(finalUrl, {
          method: 'HEAD',
          redirect: 'manual', // 手动处理重定向
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const status = response.status;
        // 检查是否是重定向状态码 (300-399)
        if (status >= 300 && status < 400) {
          const location = response.headers.get('location');
          if (location) {
            // 解析重定向URL
            try {
              // 如果location是相对路径，需要结合原始URL
              finalUrl = new URL(location, finalUrl).toString();
              redirectCount++;
              continue; // 继续下一次重定向
            } catch (e) {
              // 如果转换失败，返回错误
              console.log('无法解析重定向URL:', location);
              return new Response(JSON.stringify({ 
                error: '无法解析重定向URL: ' + location,
                success: false 
              }), { status: 500, headers: corsHeaders });
            }
          } else {
            // 有重定向状态但没有location头
            break;
          }
        } else {
          // 不是重定向状态，结束循环
          break;
        }
      } catch (error) {
        console.error('重定向处理错误:', error.message);
        return new Response(JSON.stringify({ 
          error: '请求处理失败: ' + error.message,
          success: false 
        }), { status: 500, headers: corsHeaders });
      }
    }

    // 返回最终URL
    return new Response(JSON.stringify({ 
      url: finalUrl, 
      success: true, 
      method: 'follow_redirect',
      redirectCount: redirectCount
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('重定向处理错误:', error);
    return new Response(JSON.stringify({ 
      error: '请求处理失败: ' + (error && error.message ? error.message : String(error)), 
      success: false 
    }), { status: 500, headers: corsHeaders });
  }
}