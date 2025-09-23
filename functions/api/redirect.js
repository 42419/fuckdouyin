// Cloudflare Functions - 短链接重定向处理

/**
 * 处理短链接重定向请求
 * @param {Request} request - HTTP请求对象
 * @param {Env} env - 环境变量对象
 * @param {Context} context - 执行上下文
 * @returns {Response} HTTP响应对象
 */
export async function onRequestGet(request, env, context) {
  try {
    // 从URL查询参数中获取短链接
    const urlParams = new URL(request.url).searchParams;
    const url = urlParams.get('url');
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: '缺少URL参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`处理重定向请求: ${url}`);
    
    // 发送请求但不跟随重定向
    const response = await fetch(url, {
      redirect: 'manual', // 不跟随重定向
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    // 检查是否有重定向响应头
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        console.log(`获取到重定向URL: ${redirectUrl}`);
        return new Response(
          JSON.stringify({ url: redirectUrl }),
          { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }
    
    // 如果没有重定向，直接返回原始URL
    console.log('未找到重定向，返回原始URL');
    return new Response(
      JSON.stringify({ url }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    console.error('重定向处理错误:', error.message);
    return new Response(
      JSON.stringify({ error: '代理请求失败: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}