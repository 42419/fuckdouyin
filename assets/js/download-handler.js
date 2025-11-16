// ==================== 视频下载处理模块 ====================
// 处理视频下载相关功能

// 处理前端下载 - 直接下载版
async function handleDownload(element, event) {
    event.preventDefault(); // 阻止默认的链接点击行为
    
    // 从data属性获取URL和文件名，避免直接使用href
    const url = element.dataset.url;
    const filename = element.dataset.filename;
    
    if (!url || url === 'undefined') {
        alert('下载链接无效，请稍后再试');
        return;
    }
    
    console.log(`开始下载: ${filename}，URL: ${url}`);
    
    // 显示加载状态并显示进度条
    showLoading(true, true);
    
    // 添加额外的用户提示
    const originalText = element.innerHTML;
    element.innerHTML = '下载中...';
    element.style.pointerEvents = 'none'; // 防止重复点击
    element.style.opacity = '0.7'; // 视觉上表示按钮不可用
    
    // 检查是否在本地环境运行
    const isLocalEnvironment = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1' || 
                              window.location.hostname === '0.0.0.0';
    
    if (isLocalEnvironment) {
        // 本地环境使用本地服务器下载
        console.log('检测到本地环境，使用本地服务器下载视频');
        tryLocalServerDownload(url, filename, element, originalText);
    } else {
        // 非本地环境使用Cloudflare Workers代理下载
        console.log('检测到云端环境，使用Workers代理下载视频');
        tryWorkersDownload(url, filename, element, originalText);
    }
}

// 本地服务器下载
function tryLocalServerDownload(url, filename, element, originalText) {
    // 使用本地服务器的下载API
    const localApiUrl = `/api/download?url=${encodeURIComponent(url)}`;
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = localApiUrl;
    link.download = filename || 'douyin.mp4';
    
    // 模拟点击事件
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(link);
        showLoading(false);
        // 恢复按钮状态
        element.innerHTML = originalText;
        element.style.pointerEvents = 'auto';
        element.style.opacity = '1';
    }, 100);
}

// Workers代理下载
function tryWorkersDownload(url, filename, element, originalText) {
    try {
        // 使用您的自定义域名作为Cloudflare Worker下载代理
        const workerProxyUrl = `https://redirect-expander.liyunfei.eu.org/download?url=${encodeURIComponent(url)}`;
        
        // 获取遮罩中的进度条元素
        const loadingElement = document.getElementById('loading');
        const progressContainer = loadingElement.querySelector('.download-progress-container');
        const progressFill = loadingElement.querySelector('.download-progress-fill');
        const progressText = loadingElement.querySelector('.download-progress-text');
        
        // 更新遮罩中的文本为下载状态
        const loadingText = loadingElement.querySelector('p');
        if (loadingText) {
            loadingText.textContent = '正在下载视频...';
        }
        
        fetch(workerProxyUrl, {
            method: 'GET',
            headers: {
                'Accept': '*/*'
            }
        })
        .then(response => {
            console.log('Worker代理下载响应状态:', response.status);
            
            if (!response.ok) {
                throw new Error(`下载请求失败: ${response.status} - ${response.statusText}`);
            }
            
            // 检查响应类型
            const contentType = response.headers.get('content-type');
            console.log('响应内容类型:', contentType);
            
            // 检查是否是HTML响应（说明代理失败）
            if (contentType && contentType.includes('text/html')) {
                throw new Error('代理返回了HTML页面，可能视频URL无效或需要特殊处理');
            }
            
            // 读取响应体并更新进度
            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength, 10);
            let loaded = 0;
            
            const reader = response.body.getReader();
            const chunks = [];
            
            // 更新进度的函数
            const updateProgress = () => {
                if (total) {
                    const percentage = Math.round((loaded / total) * 100);
                    progressFill.style.width = percentage + '%';
                    progressText.textContent = percentage + '%';
                } else {
                    // 如果没有content-length，显示加载动画
                    const currentWidth = parseFloat(progressFill.style.width) || 0;
                    progressFill.style.width = ((currentWidth + 5) % 100) + '%';
                    progressText.textContent = '...';
                }
            };
            
            // 读取数据块
            const read = () => {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        // 合并所有数据块
                        const blob = new Blob(chunks);
                        
                        console.log('下载的blob大小:', blob.size, 'bytes');
                        console.log('blob类型:', blob.type);
                        
                        // 检查blob是否有效
                        if (blob.size === 0) {
                            throw new Error('下载的文件为空');
                        }
                        
                        // 创建下载链接并触发下载
                        const downloadUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = filename || 'douyin.mp4';
                        
                        // 模拟点击事件
                        document.body.appendChild(link);
                        link.click();
                        
                        // 清理
                        setTimeout(() => {
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(downloadUrl);
                            showLoading(false);
                            // 恢复按钮状态
                            element.innerHTML = originalText;
                            element.style.pointerEvents = 'auto';
                            element.style.opacity = '1';
                        }, 100);
                        
                        console.log('下载完成');
                        return;
                    }
                    
                    chunks.push(value);
                    loaded += value.length;
                    updateProgress();
                    
                    // 继续读取
                    read();
                }).catch(error => {
                    throw error;
                });
            };
            
            // 开始读取数据
            read();
        })
        .catch(error => {
            throw error;
        });
    } catch (error) {
        console.error('Worker代理下载失败:', error.message);
        
        // 隐藏遮罩和进度条
        showLoading(false);
        
        // 方法: 尝试直接下载（备用方案）
        console.log('尝试直接下载作为备用方案');
        tryDirectDownload(url, filename, element, originalText);
    }
}

// 直接下载备用方案
function tryDirectDownload(url, filename, element, originalText) {
    // 创建直接下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'douyin.mp4';
    link.target = '_blank'; // 在新标签页中打开
    
    // 提示用户保存文件
    alert('请点击"确定"后，在新打开的页面中右键点击视频并选择"另存为"来保存视频');
    
    // 模拟点击事件
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(link);
        showLoading(false);
        // 恢复按钮状态
        element.innerHTML = originalText;
        element.style.pointerEvents = 'auto';
        element.style.opacity = '1';
        
        // 显示下载指导
        showDownloadGuidance(url, filename, element, originalText);
    }, 100);
}

// 显示下载指导
function showDownloadGuidance(url, filename, element, originalText) {
    const guidance = `
        <div id="downloadGuidanceModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.6); z-index: 10000; 
                    display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
                <h3 style="color: #333; margin-top: 0;">📥 下载指导</h3>
                <p style="color: #666; line-height: 1.5;">
                    自动下载失败，请尝试以下方法：
                </p>
                <ol style="color: #666; line-height: 1.8;">
                    <li><strong>右键保存</strong>：右键点击下方链接，选择"另存为"</li>
                    <li><strong>新窗口打开</strong>：点击链接在新窗口打开，然后保存视频</li>
                    <li><strong>复制链接</strong>：复制链接到下载工具中下载</li>
                </ol>
                <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <p style="margin: 0; font-size: 12px; color: #666;">视频链接：</p>
                    <input type="text" value="${url}" readonly 
                           style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;">
                </div>
                <div style="text-align: center;">
                    <a href="${url}" target="_blank" 
                       style="display: inline-block; background: #007bff; color: white; 
                              padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px;">
                        🔗 打开视频链接
                    </a>
                    <button id="closeGuidanceBtn" 
                            style="background: #6c757d; color: white; border: none; 
                                   padding: 10px 20px; border-radius: 5px; margin: 5px; cursor: pointer;">
                        关闭
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', guidance);
    
    // 添加关闭按钮事件监听器
    const closeBtn = document.getElementById('closeGuidanceBtn');
    const modal = document.getElementById('downloadGuidanceModal');
    
    const closeModal = () => {
        if (modal && modal.parentElement) {
            modal.parentElement.removeChild(modal);
        }
        if (element) {
            element.innerHTML = originalText;
            element.style.pointerEvents = 'auto';
            element.style.opacity = '1';
        }
    };
    
    closeBtn.addEventListener('click', closeModal);
    
    // 处理ESC键关闭
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}
