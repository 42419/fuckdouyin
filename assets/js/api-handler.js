// ==================== API请求处理模块 ====================

// 发送API请求获取视频数据 - 适配Douyin_TikTok_Download_API项目
function fetchVideoData(apiUrl) {
    // 添加完整的CORS选项
    fetch(apiUrl, {
        method: 'GET',
        mode: 'cors', // 允许跨域请求
        credentials: 'omit', // 不发送凭证
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        cache: 'no-cache',
        redirect: 'follow',
        referrerPolicy: 'no-referrer'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            showLoading(false);
            displayVideoData(data);
            // 保存到历史记录
            if (typeof addToHistory === 'function') {
                addToHistory(data);
            }
        })
        .catch(error => {
            showLoading(false);
            
            // 提供更详细的CORS错误信息和解决方案
            let errorMessage = '获取视频数据失败';
            
            if (error.message.includes('Failed to fetch')) {
                // 检查是否是CORS错误（在某些浏览器中错误消息可能不会明确包含CORS）
                const isCorsError = !error.message.includes('NetworkError') && 
                                   !error.message.includes('Failed to resolve');
                
                if (isCorsError) {
                    errorMessage = '跨域请求被阻止 (CORS错误)';
                    errorMessage += '\n\n解决方案：';
                    errorMessage += '\n1. 在API服务器端配置CORS策略（推荐）';
                    errorMessage += '\n   - 对于FastAPI，请添加CORS中间件并允许http://192.168.31.110:5500作为源';
                    errorMessage += '\n   - 示例代码: from fastapi.middleware.cors import CORSMiddleware';
                    errorMessage += '\n   app.add_middleware(CORSMiddleware, allow_origins=["http://192.168.31.110:5500"], allow_methods=["*"])';
                    errorMessage += '\n2. 使用浏览器扩展临时禁用CORS（仅开发测试用）';
                    errorMessage += '\n3. 配置代理服务器转发请求';
                } else {
                    errorMessage = '无法连接到API服务器，请检查：';
                    errorMessage += '\n- API服务是否正在运行 (https://dapi.liyunfei.eu.org)';
                    errorMessage += '\n- 网络连接是否正常';
                    errorMessage += '\n- API端点是否正确 (fetch_one_video)';
                }
            }
            
            alert(`${errorMessage}\n\n详细错误: ${error.message}`);
            console.error('API请求错误:', error);
            console.error('请求的API URL:', apiUrl);
        });
}

// 显示或隐藏加载状态
function showLoading(isLoading, showProgress = false) {
    let loadingElement = document.getElementById('loading');
    
    if (isLoading) {
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'loading';
            loadingElement.className = 'loading-overlay';
            loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <p>正在解析视频...</p>
                <div class="download-progress-container" style="display: none; margin-top: 20px; width: 200px;">
                    <div class="download-progress-bar">
                        <div class="download-progress-fill"></div>
                    </div>
                    <div class="download-progress-text">0%</div>
                </div>
            `;
            document.body.appendChild(loadingElement);
        }
        loadingElement.style.display = 'flex';
        
        // 控制进度条显示
        const progressContainer = loadingElement.querySelector('.download-progress-container');
        if (progressContainer) {
            progressContainer.style.display = showProgress ? 'block' : 'none';
        }
    } else if (loadingElement) {
        loadingElement.style.display = 'none';
        // 重置进度条
        const progressFill = loadingElement.querySelector('.download-progress-fill');
        const progressText = loadingElement.querySelector('.download-progress-text');
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';
    }
}
