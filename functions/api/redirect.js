// Cloudflare Functions - 增强版短链接重定向处理

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
    let methodUsed = '';
    
    // 方法1: 使用fetch with redirect: 'manual' - 获取Location头
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
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });
      
      // 检查重定向状态码
      if (response.status >= 300 && response.status < 400) {
        redirectUrl = response.headers.get('location');
        if (redirectUrl) {
          console.log(`方法1获取到重定向URL: ${redirectUrl}`);
          methodUsed = 'location_header';
        }
      }
    } catch (error) {
      console.log('方法1失败:', error.message);
    }
    
    // 方法2: 使用HEAD请求获取重定向
    if (!redirectUrl) {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
          },
          timeout: 8000
        });
        
        if (response.status >= 300 && response.status < 400) {
          redirectUrl = response.headers.get('location');
          if (redirectUrl) {
            console.log(`方法2获取到重定向URL: ${redirectUrl}`);
            methodUsed = 'head_request';
          }
        }
      } catch (error) {
        console.log('方法2失败:', error.message);
      }
    }
    
    // 方法3: 跟随重定向获取最终URL
    if (!redirectUrl) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
          },
          timeout: 15000
        });
        
        // 如果最终URL与原始URL不同，说明发生了重定向
        if (response.url !== url) {
          redirectUrl = response.url;
          console.log(`方法3获取到重定向URL: ${redirectUrl}`);
          methodUsed = 'follow_redirect';
        }
      } catch (error) {
        console.log('方法3失败:', error.message);
      }
    }
    
    // 方法4: 对于抖音短链接，使用第三方服务
    if (!redirectUrl && url.includes('v.douyin.com')) {
      try {
        // 尝试使用第三方短链接解析服务
        const thirdPartyServices = [
          `https://api.short.link/expand?short=${encodeURIComponent(url)}`,
          `https://unshorten.me/api/v2/unshorten?url=${encodeURIComponent(url)}`,
          `https://api.unshorten.it/unshorten?url=${encodeURIComponent(url)}`
        ];
        
        for (const serviceUrl of thirdPartyServices) {
          try {
            const response = await fetch(serviceUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              timeout: 5000
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.expanded_url || data.long_url || data.url) {
                redirectUrl = data.expanded_url || data.long_url || data.url;
                console.log(`方法4通过第三方服务获取到URL: ${redirectUrl}`);
                methodUsed = 'third_party_service';
                break;
              }
            }
          } catch (error) {
            continue; // 尝试下一个服务
          }
        }
      } catch (error) {
        console.log('方法4失败:', error.message);
      }
    }
    
    // 方法5: 对于抖音短链接，尝试模式匹配和URL构建
    if (!redirectUrl && url.includes('v.douyin.com')) {
      try {
        const shortIdMatch = url.match(/v\.douyin\.com\/([a-zA-Z0-9_-]+)/);
        if (shortIdMatch) {
          const shortId = shortIdMatch[1];
          
          // 构建可能的完整URL模式
          const possibleUrls = [
            `https://www.douyin.com/video/${shortId}`,
            `https://www.douyin.com/aweme/v1/play/?video_id=${shortId}`,
            `https://www.douyin.com/share/video/${shortId}`,
            `https://www.douyin.com/video/${shortId}/`,
            `https://www.douyin.com/aweme/v1/play/?video_id=${shortId}&is_play_url=1&source=PackSourceEnum_AWEME_DETAIL`
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
                timeout: 3000
              });
              
              if (testResponse.status === 200 || testResponse.status === 302) {
                redirectUrl = testUrl;
                console.log(`方法5找到可能的URL: ${redirectUrl}`);
                methodUsed = 'pattern_matching';
                break;
              }
            } catch (error) {
              continue;
            }
          }
        }
      } catch (error) {
        console.log('方法5失败:', error.message);
      }
    }
    
    // 方法6: 使用Cloudflare Workers的HTML解析能力
    if (!redirectUrl) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 10000
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // 尝试从HTML中提取重定向信息
          const metaRefreshMatch = html.match(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*content=["']?\d+;\s*url=([^"'>\s]+)/i);
          if (metaRefreshMatch) {
            redirectUrl = metaRefreshMatch[1];
            console.log(`方法6从meta refresh获取到URL: ${redirectUrl}`);
            methodUsed = 'html_parsing';
          }
          
          // 尝试从JavaScript中提取重定向信息
          if (!redirectUrl) {
            const jsRedirectMatch = html.match(/window\.location\.href\s*=\s*["']([^"']+)["']/i);
            if (jsRedirectMatch) {
              redirectUrl = jsRedirectMatch[1];
              console.log(`方法6从JavaScript获取到URL: ${redirectUrl}`);
              methodUsed = 'javascript_parsing';
            }
          }
        }
      } catch (error) {
        console.log('方法6失败:', error.message);
      }
    }
    
    // 返回结果
    if (redirectUrl) {
      console.log(`最终重定向URL: ${redirectUrl}`);
      return new Response(
        JSON.stringify({ 
          url: redirectUrl,
          success: true,
          method: methodUsed || 'unknown',
          original_url: url
        }),
        { headers: corsHeaders }
      );
    } else {
      console.log('所有方法都失败，返回原始URL');
      return new Response(
        JSON.stringify({ 
          url: url,
          success: false,
          method: 'all_methods_failed',
          message: '无法获取重定向URL，请手动打开链接获取完整地址',
          original_url: url
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
        method: 'error',
        original_url: url || 'unknown'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}