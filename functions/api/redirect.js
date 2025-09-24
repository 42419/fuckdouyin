// Cloudflare Functions - 短链接重定向处理

/**
 * 处理短链接重定向请求
 * @param {Request} request - HTTP请求对象
 * @param {Env} env - 环境变量对象
 * @param {Context} context - 执行上下文
 * @returns {Response} HTTP响应对象
 */
export async function onRequestGet(request, env, context) {
  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理OPTIONS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // 从URL查询参数中获取短链接
    const urlParams = new URL(request.url).searchParams;
    const url = urlParams.get('url');
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: '缺少URL参数' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 验证URL格式
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return new Response(
        JSON.stringify({ error: '无效的URL格式' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`处理重定向请求: ${url}`);
    
    // 尝试多种方法获取重定向URL
    let redirectUrl = null;
    
    // 方法1: 使用fetch with redirect: 'manual'
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000 // 10秒超时
      });
      
      // 检查重定向状态码
      if (response.status >= 300 && response.status < 400) {
        redirectUrl = response.headers.get('location');
        if (redirectUrl) {
          console.log(`方法1获取到重定向URL: ${redirectUrl}`);
        }
      }
    } catch (error) {
      console.log('方法1失败:', error.message);
    }
    
    // 方法2: 如果方法1失败，尝试跟随重定向但限制深度
    if (!redirectUrl) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 15000 // 15秒超时
        });
        
        // 如果最终URL与原始URL不同，说明发生了重定向
        if (response.url !== url) {
          redirectUrl = response.url;
          console.log(`方法2获取到重定向URL: ${redirectUrl}`);
        }
      } catch (error) {
        console.log('方法2失败:', error.message);
      }
    }
    
    // 方法3: 对于抖音短链接，尝试解析可能的模式
    if (!redirectUrl && url.includes('v.douyin.com')) {
      try {
        // 尝试从短链接中提取可能的视频ID模式
        const shortIdMatch = url.match(/v\.douyin\.com\/([a-zA-Z0-9_-]+)/);
        if (shortIdMatch) {
          const shortId = shortIdMatch[1];
          // 构建可能的完整URL模式
          const possibleUrls = [
            `https://www.douyin.com/video/${shortId}`,
            `https://www.douyin.com/aweme/v1/play/?video_id=${shortId}`,
            `https://www.douyin.com/share/video/${shortId}`
          ];
          
          // 尝试这些可能的URL
          for (const testUrl of possibleUrls) {
            try {
              const testResponse = await fetch(testUrl, {
                method: 'HEAD',
                redirect: 'manual',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 5000
              });
              
              if (testResponse.status === 200) {
                redirectUrl = testUrl;
                console.log(`方法3找到可能的URL: ${redirectUrl}`);
                break;
              }
            } catch (error) {
              // 继续尝试下一个URL
              continue;
            }
          }
        }
      } catch (error) {
        console.log('方法3失败:', error.message);
      }
    }
    
    // 返回结果
    if (redirectUrl) {
      console.log(`最终重定向URL: ${redirectUrl}`);
      return new Response(
        JSON.stringify({ 
          url: redirectUrl,
          success: true,
          method: 'redirect_resolved'
        }),
        { headers: corsHeaders }
      );
    } else {
      console.log('未找到重定向，返回原始URL');
      return new Response(
        JSON.stringify({ 
          url: url,
          success: false,
          method: 'no_redirect_found',
          message: '无法获取重定向URL，请手动打开链接获取完整地址'
        }),
        { headers: corsHeaders }
      );
    }
    
  } catch (error) {
    console.error('重定向处理错误:', error.message);
    return new Response(
      JSON.stringify({ 
        error: '代理请求失败: ' + error.message,
        success: false,
        method: 'error'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}