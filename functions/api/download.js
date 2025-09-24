// Cloudflare Functions - 视频下载代理API
export async function onRequestGet(request, env, context) {
  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理OPTIONS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // 从URL查询参数中获取视频URL
    const urlParams = new URL(request.url).searchParams;
    const videoUrl = urlParams.get('url');
    
    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: '缺少视频URL参数' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`代理下载请求: ${videoUrl}`);
    
    // 发送请求到视频服务器
    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.douyin.com/',
        'Accept': '*/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`视频请求失败: ${response.status} - ${response.statusText}`);
    }
    
    // 获取视频数据
    const videoData = await response.arrayBuffer();
    
    // 设置响应头
    const downloadHeaders = {
      'Content-Type': response.headers.get('content-type') || 'video/mp4',
      'Content-Length': videoData.byteLength.toString(),
      'Cache-Control': 'no-cache',
      'Content-Disposition': 'attachment'
    };
    
    // 返回视频数据
    return new Response(videoData, { headers: downloadHeaders });
    
  } catch (error) {
    console.error('下载代理错误:', error.message);
    return new Response(
      JSON.stringify({ error: '下载失败: ' + error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}
