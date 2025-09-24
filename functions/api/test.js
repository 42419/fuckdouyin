// Cloudflare Functions - 简单测试函数
export async function onRequestGet(request, env, context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const urlParams = new URL(request.url).searchParams;
    const url = urlParams.get('url');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cloudflare Functions 工作正常',
      received_url: url || '无URL参数',
      timestamp: new Date().toISOString()
    }), { headers: corsHeaders });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500, headers: corsHeaders });
  }
}
