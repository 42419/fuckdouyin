// Cloudflare Functions - 第三方重定向服务API

/**
 * 使用第三方服务处理短链接重定向
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
    // 从URL查询参数中获取短链接
    const urlParams = new URL(request.url).searchParams;
    const url = urlParams.get('url');
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: '缺少URL参数' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`使用第三方服务处理重定向请求: ${url}`);
    
    // 第三方服务列表
    const services = [
      {
        name: 'unshorten.me',
        url: `https://unshorten.me/api/v2/unshorten?url=${encodeURIComponent(url)}`,
        parser: (data) => data.long_url || data.url
      },
      {
        name: 'unshorten.it',
        url: `https://api.unshorten.it/unshorten?url=${encodeURIComponent(url)}`,
        parser: (data) => data.expanded_url || data.url
      },
      {
        name: 'short.link',
        url: `https://api.short.link/expand?short=${encodeURIComponent(url)}`,
        parser: (data) => data.expanded_url || data.url
      },
      {
        name: 'expandurl',
        url: `https://expandurl.net/api/v1/expand?url=${encodeURIComponent(url)}`,
        parser: (data) => data.expanded_url || data.url
      }
    ];
    
    // 尝试每个服务
    for (const service of services) {
      try {
        console.log(`尝试服务: ${service.name}`);
        
        const response = await fetch(service.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          // 某些服务返回text/plain，需要安全解析
          const text = await response.text();
          let data;
          try { data = JSON.parse(text); } catch { data = { url: text }; }
          const expandedUrl = service.parser(data);
          
          if (expandedUrl && expandedUrl !== url) {
            console.log(`服务 ${service.name} 成功获取到URL: ${expandedUrl}`);
            return new Response(
              JSON.stringify({ 
                url: expandedUrl,
                success: true,
                method: `third_party_${service.name}`,
                service: service.name,
                original_url: url
              }),
              { headers: corsHeaders }
            );
          }
        }
      } catch (error) {
        console.log(`服务 ${service.name} 失败:`, error.message);
        continue;
      }
    }
    
    // 所有服务都失败
    return new Response(
      JSON.stringify({ 
        url: url,
        success: false,
        method: 'all_third_party_failed',
        message: '所有第三方服务都无法解析此短链接',
        original_url: url
      }),
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('第三方服务处理错误:', error.message);
    return new Response(
      JSON.stringify({ 
        error: '第三方服务请求失败: ' + error.message,
        success: false,
        method: 'error',
        original_url: url || 'unknown'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
