const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静态文件服务
app.use(express.static(path.join(__dirname, '.')));

// 解析JSON请求体
app.use(express.json());

// 短链接重定向代理API
app.get('/api/redirect', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }
    
    console.log(`处理重定向请求: ${url}`);
    
    // 发送请求但不跟随重定向
    const response = await axios.get(url, {
      maxRedirects: 0, // 不跟随重定向
      validateStatus: status => status >= 200 && status < 400 || status === 301 || status === 302 || status === 307 || status === 308
    });
    
    // 检查是否有重定向响应头
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.location;
      console.log(`获取到重定向URL: ${redirectUrl}`);
      return res.json({ url: redirectUrl });
    } else {
      // 如果没有重定向，直接返回原始URL
      console.log('未找到重定向，返回原始URL');
      return res.json({ url });
    }
  } catch (error) {
    console.error('重定向处理错误:', error.message);
    res.status(500).json({ error: '代理请求失败: ' + error.message });
  }
});

// 视频下载代理API - 解决CORS问题
app.get('/api/download', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }
    
    console.log(`代理下载请求: ${url}`);
    
    // 设置CORS头
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // 发送请求到抖音服务器
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.douyin.com/',
        'Accept': '*/*'
      },
      timeout: 30000 // 30秒超时
    });
    
    // 设置响应头
    res.set({
      'Content-Type': response.headers['content-type'] || 'video/mp4',
      'Content-Length': response.headers['content-length'],
      'Cache-Control': 'no-cache'
    });
    
    // 流式传输数据
    response.data.pipe(res);
    
  } catch (error) {
    console.error('下载代理错误:', error.message);
    res.status(500).json({ error: '下载失败: ' + error.message });
  }
});

// 启动服务器
const serverPort = process.argv[2] || PORT;
app.listen(serverPort, () => {
    console.log(`服务器运行在 http://localhost:${serverPort}`);
    console.log('请在浏览器中访问此地址来使用抖音下载工具');
});