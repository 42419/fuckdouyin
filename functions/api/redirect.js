// Cloudflare Functions - 超简化重定向处理
export async function onRequestGet(request, env, context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const urlParams = new URL(request.url).searchParams;
    const inputUrl = urlParams.get('url');

    if (!inputUrl) {
      return new Response(JSON.stringify({ error: '缺少URL参数' }), { status: 400, headers: corsHeaders });
    }

    // 对于抖音短链接，提供用户友好的指导
    if (inputUrl.includes('v.douyin.com')) {
      return new Response(JSON.stringify({ 
        success: false,
        url: inputUrl,
        method: 'user_guidance_needed',
        message: '检测到抖音短链接，请按照指导获取完整URL',
        guidance: {
          title: '获取抖音完整链接的方法',
          steps: [
            '1. 点击下方按钮打开短链接',
            '2. 等待页面完全加载',
            '3. 复制浏览器地址栏中的完整URL',
            '4. 粘贴到输入框中'
          ],
          shortLink: inputUrl,
          possiblePatterns: [
            'https://www.douyin.com/video/视频ID',
            'https://www.douyin.com/aweme/v1/play/?video_id=视频ID',
            'https://www.douyin.com/share/video/视频ID'
          ]
        }
      }), { headers: corsHeaders });
    }

    // 对于其他URL，尝试简单的重定向检测
    try {
      const response = await fetch(inputUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const location = response.headers.get('location');
      if (location) {
        return new Response(JSON.stringify({ 
          url: location, 
          success: true, 
          method: 'location_header' 
        }), { headers: corsHeaders });
      }
    } catch (error) {
      // 忽略错误，继续执行
    }

    return new Response(JSON.stringify({ 
      url: inputUrl, 
      success: false, 
      method: 'no_redirect_found',
      message: '无法自动获取重定向URL'
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: '请求处理失败: ' + (error && error.message ? error.message : String(error)), 
      success: false 
    }), { status: 500, headers: corsHeaders });
  }
}