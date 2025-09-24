// 格式化数字（添加千位分隔符）
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function toggleMenu() {
    const banner = document.getElementById('banner');
    const button = document.querySelector('.menu-toggle');
    banner.classList.toggle('active');
    button.classList.toggle('active');
}


// 点击外部关闭菜单
document.addEventListener('click', function(event) {
    const banner = document.getElementById('banner');
    const button = document.querySelector('.menu-toggle');
    if (!banner.contains(event.target) && event.target !== button && banner.classList.contains('active')) {
        banner.classList.remove('active');
        button.classList.remove('active');
    }
});

// ESC 键关闭菜单（增强无障碍）
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const banner = document.getElementById('banner');
        const button = document.querySelector('.menu-toggle');
        if (banner.classList.contains('active')) {
            banner.classList.remove('active');
            button.classList.remove('active');
        }
    }
});

// 设置当前页面的激活导航项
function setActiveNavItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('#banner li a');
    
    navLinks.forEach(link => {
        // 检查链接是否是 href="#"，如果是则跳过
        if (link.getAttribute('href') === '#') {
            return;
        }
        
        const linkPath = new URL(link.href).pathname;
        // 匹配当前路径，如果是首页则特殊处理
        if ((currentPath === '/' || currentPath === '/index.html') && linkPath === '/index.html') {
            link.classList.add('active');
        } else if (currentPath === linkPath) {
            link.classList.add('active');
        }
    });
}

// 处理前端下载 - 全局函数
function handleDownload(element, event, url, filename) {
    event.preventDefault(); // 阻止默认的链接点击行为，避免跳转到预览
    
    // 显示加载状态
    showLoading(true);
    
    // 添加额外的用户提示
    const originalText = element.innerHTML;
    element.innerHTML = '下载中...';
    element.style.pointerEvents = 'none'; // 防止重复点击
    element.style.opacity = '0.7'; // 视觉上表示按钮不可用
    
    // 使用代理服务器下载，避免CORS问题
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}`;
    console.log('使用代理下载:', proxyUrl);
    
    // 使用fetch API通过代理下载
    fetch(proxyUrl, {
        method: 'GET',
        headers: {
            'Accept': '*/*'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`下载请求失败: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // 创建下载链接并触发下载
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        
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
    })
    .catch(error => {
        console.error('下载失败:', error);
        showLoading(false);
        alert(`下载失败: ${error.message}\n\n请检查服务器是否正在运行，或尝试刷新页面重试。`);
        // 恢复按钮状态
        element.innerHTML = originalText;
        element.style.pointerEvents = 'auto';
        element.style.opacity = '1';
    });
}

// 页面加载时的应用逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 设置当前页面的激活导航项
    setActiveNavItem();
    
    // 获取表单元素
    const downloadForm = document.querySelector('.download-form');
    const searchInput = document.getElementById('search');
    
    // 为表单添加提交事件监听器
    downloadForm.addEventListener('submit', function(event) {
        event.preventDefault(); // 阻止表单默认提交
        
        const inputValue = searchInput.value.trim();
        if (!inputValue) {
            alert('请输入视频链接或视频ID');
            return;
        }
        
        // 从输入值中提取视频ID
        const awemeId = extractAwemeId(inputValue);
        
        if (!awemeId) {
            alert('无法从输入中提取视频ID，请检查输入格式');
            return;
        }
        
        // 检查是否是需要重定向处理的抖音短链接
        if (awemeId.startsWith('redirect:')) {
            const shortLink = awemeId.replace('redirect:', '');
            showLoading(true);
            
            // 调用重定向处理函数
            handleShortLinkRedirect(shortLink, function(redirectedUrl) {
                if (!redirectedUrl) {
                    showLoading(false);
                    alert('无法获取短链接的重定向地址，请稍后再试');
                    return;
                }
                
                // 从重定向后的URL中再次提取视频ID
                const finalAwemeId = extractAwemeId(redirectedUrl);
                if (!finalAwemeId) {
                    showLoading(false);
                    alert('无法从重定向后的URL中提取视频ID，请检查输入格式');
                    return;
                }
                
                // 构建API请求URL - 使用fetch_one_video接口
                const apiUrl = `https://dapi.liyunfei.eu.org/api/douyin/web/fetch_one_video?aweme_id=${finalAwemeId}`;
                
                // 发送API请求
                fetchVideoData(apiUrl);
            });
            return;
        }
        
        // 检查是否是用户主页链接
        if (awemeId.startsWith('userProfile:')) {
            showLoading(false);
            alert('检测到用户主页链接，但目前仅支持单个视频的下载');
            return;
        }
        
        // 构建API请求URL - 使用fetch_one_video接口
        const apiUrl = `https://dapi.liyunfei.eu.org/api/douyin/web/fetch_one_video?aweme_id=${awemeId}`;
        
        // 显示加载状态
        showLoading(true);
        
        // 发送API请求
        fetchVideoData(apiUrl);
    });
});

// 处理窗口大小变化时的菜单状态
window.addEventListener('resize', function() {
    const banner = document.getElementById('banner');
    const button = document.querySelector('.menu-toggle');
    
    // 如果窗口变大到768px以上并且菜单是激活状态，则隐藏菜单
    if (window.innerWidth > 768 && banner.classList.contains('active')) {
        banner.classList.remove('active');
        button.classList.remove('active');
    }
});

// 从输入值中提取视频ID - 增强版，支持抖音短链接和混合文本
function extractAwemeId(input) {
    // 检查是否直接输入了视频ID
    if (/^\d{18,19}$/.test(input)) {
        return input;
    }
    
    // 尝试从URL中提取视频ID（原有的直接提取逻辑）
    const urlPatterns = [
        /aweme_id=(\d{18,19})/,
        /video\/(\d{18,19})/,
        /(\d{18,19})\?/,
        /(\d{18,19})$/ // 修复：添加了结束斜杠
    ];
    
    for (const pattern of urlPatterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    // 新增：检查是否是抖音分享短链接格式 (v.douyin.com)
    const shortLinkPattern = /https:\/\/v\.douyin\.com\/[a-zA-Z0-9_-]+/;
    const shortLinkMatch = input.match(shortLinkPattern);
    
    if (shortLinkMatch) {
        const shortLink = shortLinkMatch[0].replace(/\/$/, ''); // 移除可能的末尾斜杠
        
        // 由于浏览器安全限制，我们无法在前端直接获取重定向URL
        // 因此，我们需要通过一个异步请求来处理这个情况
        // 这里返回特殊标识，提示调用者需要进行异步处理
        return `redirect:${shortLink}`;
    }
    
    // 新增：检查是否包含抖音用户主页链接格式
    const userProfilePattern = /https:\/\/www\.douyin\.com\/user\/[^/?]+/;
    const userProfileMatch = input.match(userProfilePattern);
    
    if (userProfileMatch) {
        // 用户主页链接通常不包含视频ID，返回特殊标识
        return `userProfile:${userProfileMatch[0]}`;
    }
    
    // 尝试从混合文本中提取可能的视频ID
    const possibleIdMatch = input.match(/(\d{18,19})/);
    if (possibleIdMatch) {
        return possibleIdMatch[1];
    }
    
    return null;
}

// 处理抖音短链接的重定向 - 新增函数
// 处理抖音短链接的重定向 - 集成Cloudflare Workers
function handleShortLinkRedirect(shortLink, callback) {
    console.log('开始智能重定向处理:', shortLink);
    
    // 方法1: 优先使用Cloudflare Workers
    tryCloudflareWorkers(shortLink, callback);
}

// 尝试Cloudflare Workers重定向
function tryCloudflareWorkers(shortLink, callback) {
    console.log('尝试Cloudflare Workers重定向:', shortLink);
    
    const WORKER_ENDPOINT = 'https://redirect-expander.liyunfei.eu.org/expand';
    const apiUrl = `${WORKER_ENDPOINT}?url=${encodeURIComponent(shortLink)}`;
    
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
    })
    .then(response => {
        console.log('Cloudflare Workers响应状态:', response.status);
        if (!response.ok) {
            throw new Error(`Workers请求失败: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Cloudflare Workers响应数据:', data);
        
        if (data.success === true && data.url) {
            console.log('Cloudflare Workers成功获取重定向URL:', data.url);
            callback(data.url);
        } else if (data.method === 'user_guidance_needed') {
            console.log('Workers检测到需要用户引导，使用智能重定向处理器');
            // 使用智能重定向处理器显示用户引导
            if (typeof window.smartRedirectHandler !== 'undefined') {
                window.smartRedirectHandler.handleRedirect(shortLink, callback);
            } else {
                showSimpleGuidance(shortLink, callback);
            }
        } else {
            console.log('Workers无法处理，尝试智能重定向处理器');
            // 备用方案：使用智能重定向处理器
            if (typeof window.smartRedirectHandler !== 'undefined') {
                window.smartRedirectHandler.handleRedirect(shortLink, callback);
            } else {
                showSimpleGuidance(shortLink, callback);
            }
        }
    })
    .catch(error => {
        console.error('Cloudflare Workers请求出错:', error.message);
        console.log('Workers不可用，使用智能重定向处理器');
        // Workers失败，使用智能重定向处理器
        if (typeof window.smartRedirectHandler !== 'undefined') {
            window.smartRedirectHandler.handleRedirect(shortLink, callback);
        } else {
            showSimpleGuidance(shortLink, callback);
        }
    });
}

// 简单的引导方案（备用）
function showSimpleGuidance(shortLink, callback) {
    const userInput = prompt(
        '无法自动解析短链接。\n' +
        '请手动打开以下链接，然后复制完整URL：\n' +
        shortLink + '\n\n' +
        '将完整URL粘贴到下方：',
        ''
    );
    
    if (userInput && userInput.trim()) {
        callback(userInput.trim());
    } else {
        callback(null);
    }
}

// 尝试第三方服务
function tryThirdPartyServices(shortLink, callback) {
    console.log('尝试第三方服务处理短链接:', shortLink);
    
    const thirdPartyUrl = `/api/third-party-redirect?url=${encodeURIComponent(shortLink)}`;
    console.log('发送请求到第三方服务API:', thirdPartyUrl);
    
    fetch(thirdPartyUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
    })
    .then(response => {
        console.log('第三方服务API响应状态:', response.status);
        if (!response.ok) {
            throw new Error(`第三方服务请求失败: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('第三方服务API响应数据:', data);
        
        if (data.success === true && data.url) {
            console.log('第三方服务成功获取到重定向URL:', data.url);
            callback(data.url);
        } else if (data.success === false && data.url) {
            console.log('第三方服务返回URL（可能未重定向）:', data.url);
            callback(data.url);
        } else {
            console.error('第三方服务也无法处理，使用备用方法');
            handleFallbackMethod(shortLink, callback);
        }
    })
    .catch(error => {
        console.error('第三方服务请求出错:', error.message);
        console.log('所有自动方法都失败，使用备用方法');
        handleFallbackMethod(shortLink, callback);
    });
}

// 备用处理方法 - 改进版
function handleFallbackMethod(shortLink, callback) {
    console.log('使用备用方法处理短链接');
    
    // 创建一个更友好的对话框
    const dialogHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <h3 style="margin-top: 0; color: #333;">需要手动获取完整链接</h3>
                <p style="color: #666; line-height: 1.5;">
                    由于抖音的安全限制，无法自动获取完整链接。<br>
                    请按照以下步骤操作：
                </p>
                <ol style="color: #666; line-height: 1.5;">
                    <li>点击下方按钮打开短链接</li>
                    <li>等待页面完全加载</li>
                    <li>复制浏览器地址栏中的完整URL</li>
                    <li>粘贴到下方输入框中</li>
                </ol>
                <div style="margin: 20px 0;">
                    <a href="${shortLink}" target="_blank" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                        打开短链接
                    </a>
                </div>
                <input type="text" id="fullUrlInput" placeholder="请粘贴完整URL到这里..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 15px;">
                <div style="text-align: right;">
                    <button id="cancelBtn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-right: 10px; cursor: pointer;">取消</button>
                    <button id="confirmBtn" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">确认</button>
                </div>
            </div>
        </div>
    `;
    
    // 创建对话框元素
    const dialogElement = document.createElement('div');
    dialogElement.innerHTML = dialogHtml;
    document.body.appendChild(dialogElement);
    
    // 获取对话框中的元素
    const fullUrlInput = dialogElement.querySelector('#fullUrlInput');
    const cancelBtn = dialogElement.querySelector('#cancelBtn');
    const confirmBtn = dialogElement.querySelector('#confirmBtn');
    
    // 自动聚焦到输入框
    setTimeout(() => {
        fullUrlInput.focus();
    }, 100);
    
    // 处理确认按钮点击
    confirmBtn.addEventListener('click', () => {
        const fullUrl = fullUrlInput.value.trim();
        if (fullUrl) {
            console.log('用户提供的完整URL:', fullUrl);
            document.body.removeChild(dialogElement);
            callback(fullUrl);
        } else {
            alert('请输入完整的URL');
        }
    });
    
    // 处理取消按钮点击
    cancelBtn.addEventListener('click', () => {
        console.log('用户取消输入');
        document.body.removeChild(dialogElement);
        callback(null);
    });
    
    // 处理ESC键
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(dialogElement);
            document.removeEventListener('keydown', handleEsc);
            callback(null);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    // 处理输入框回车键
    fullUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });
}

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
function showLoading(isLoading) {
    let loadingElement = document.getElementById('loading');
    
    if (isLoading) {
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'loading';
            loadingElement.className = 'loading-overlay';
            loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <p>正在解析视频...</p>
            `;
            document.body.appendChild(loadingElement);
        }
        loadingElement.style.display = 'flex';
    } else if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// 在页面上展示视频数据 - 适配fetch_one_video接口返回数据
function displayVideoData(data) {
    // 检查是否有结果区域，如果没有则创建
    let resultContainer = document.getElementById('video-result');
    if (!resultContainer) {
        resultContainer = document.createElement('section');
        resultContainer.id = 'video-result';
        resultContainer.className = 'result-section';
        
        // 插入到main标签中
        const mainElement = document.querySelector('main');
        const heroSection = document.querySelector('.hero');
        mainElement.insertBefore(resultContainer, heroSection.nextSibling);
    }
    
    console.log('fetch_one_video接口返回数据:', data);
    
    // 检查API返回数据是否成功
    // fetch_one_video接口可能返回code为0或200表示成功
    if (!data || (data.code !== 0 && data.code !== 200) || !data.data) {
        resultContainer.innerHTML = `
            <div class="error-message">
                <h3>解析失败</h3>
                <p>fetch_one_video接口返回数据格式不匹配或请求失败。</p>
                <p><strong>状态码:</strong> ${data ? data.code : '未知'}</p>
                <p><strong>错误信息:</strong> ${data && data.message ? data.message : '无'}</p>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
        console.error('fetch_one_video接口返回数据结构不匹配:', data);
        return;
    }
    
    // 尝试获取视频详情数据 - 适配fetch_one_video接口的响应结构
    let videoDetail = null;
    
    // 1. 优先检查是否有aweme_detail字段（标准格式）
    if (data.data.aweme_detail) {
        videoDetail = data.data.aweme_detail;
    }
    // 2. 检查是否有直接的视频信息（某些版本可能的格式）
    else if (data.data.video && data.data.author) {
        // 直接使用data.data作为视频详情
        videoDetail = data.data;
    }
    // 3. 尝试直接使用data.data（最通用的情况）
    else {
        videoDetail = data.data;
    }
    
    console.log('提取到的视频详情数据:', videoDetail);
    
    // 最后检查必要字段是否存在 - 增强对fetch_one_video接口的兼容性
    // 由于fetch_one_video接口可能返回不同结构的数据，我们放宽必要字段的检查
    if (!videoDetail) {
        resultContainer.innerHTML = `
            <div class="error-message">
                <h3>数据解析失败</h3>
                <p>无法从fetch_one_video接口返回数据中提取视频信息。</p>
                <pre>${JSON.stringify(data.data, null, 2)}</pre>
            </div>
        `;
        console.error('无法从fetch_one_video接口返回数据中提取视频信息:', data.data);
        return;
    }
    
    // 提取作者信息 - 处理不同可能的数据路径
    const authorInfo = videoDetail.author || {};
    const avatarUrl = authorInfo.avatar_thumb && authorInfo.avatar_thumb.url_list && authorInfo.avatar_thumb.url_list[0] ? 
        authorInfo.avatar_thumb.url_list[0] : 'https://via.placeholder.com/100';
    const nickname = authorInfo.nickname || '未知作者';
    const signature = authorInfo.signature || '暂无简介';
    const followerCount = authorInfo.follower_count || 0;
    const totalFavorited = authorInfo.total_favorited || 0;
    
    // 提取视频基本信息
    const videoTitle = videoDetail.desc || '无标题';
    const createTime = videoDetail.create_time ? 
        new Date(videoDetail.create_time * 1000).toLocaleString() : '未知时间';
    const duration = videoDetail.duration ? 
        Math.floor(videoDetail.duration / 1000) : 0;
    
    // 提取视频统计数据
    const statistics = videoDetail.statistics || {};
    const diggCount = statistics.digg_count || 0;
    const commentCount = statistics.comment_count || 0;
    const collectCount = statistics.collect_count || 0;
    const shareCount = statistics.share_count || 0;
    
    // 构建结果HTML - 安全地访问可能不存在的字段
    resultContainer.innerHTML = `
        <div class="result-container">
            <h2>视频信息</h2>
            
            <!-- 作者信息 -->
            <div class="author-info">
                <img src="${avatarUrl}" alt="作者头像" class="author-avatar">
                <div class="author-details">
                    <h3>${nickname}</h3>
                    <p>${signature.replace(/\n/g, '<br>')}</p>
                    <div class="author-stats">
                        <span>粉丝: ${formatNumber(followerCount)}</span>
                        <span>获赞: ${formatNumber(totalFavorited)}</span>
                    </div>
                </div>
            </div>
            
            <!-- 视频基本信息 -->
            <div class="video-info">
                <h3>视频详情</h3>
                <p><strong>标题:</strong> ${videoTitle}</p>
                <p><strong>发布时间:</strong> ${createTime}</p>
                <p><strong>时长:</strong> ${duration}秒</p>
            </div>
            
            <!-- 视频统计数据 -->
            <div class="video-stats">
                <div class="stat-item">
                    <span class="stat-label">点赞</span>
                    <span class="stat-value">${formatNumber(diggCount)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">评论</span>
                    <span class="stat-value">${formatNumber(commentCount)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">收藏</span>
                    <span class="stat-value">${formatNumber(collectCount)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">分享</span>
                    <span class="stat-value">${formatNumber(shareCount)}</span>
                </div>
            </div>
            
            
            <!-- 视频下载选项 - 适配fetch_one_video接口 -->
            <div class="download-options">
                <h3>下载选项</h3>
                ${generateDownloadOptions(videoDetail)}
            </div>
        </div>
    `;
}

// 根据Python脚本的逻辑实现
function generateDownloadOptions(videoDetail) {
    // 调试日志，记录传入的数据结构
    console.log('generateDownloadOptions - 视频详情数据:', videoDetail);
    
    if (!videoDetail) {
        return '<p class="error-message">无法获取下载链接</p>';
    }
    
    // 优先从bit_rate获取视频信息，这与Python脚本的逻辑处理方式一致
    let bitRates = [];
    let videoInfo = videoDetail;
    let videoFPS = 30;
    
    // 尝试不同的数据结构获取视频信息
    if (videoDetail.video && videoDetail.video.bit_rate && Array.isArray(videoDetail.video.bit_rate)) {
        bitRates = videoDetail.video.bit_rate;
        videoInfo = videoDetail.video;
        videoFPS = videoInfo.fps || 30;
    } else if (videoDetail.bit_rate && Array.isArray(videoDetail.bit_rate)) {
        bitRates = videoDetail.bit_rate;
        videoFPS = videoDetail.fps || 30;
    }
    
    // 如果有video_list，也尝试从中提取视频信息
    if (!bitRates.length && videoDetail.video_list && Array.isArray(videoDetail.video_list)) {
        videoDetail.video_list.forEach(video => {
            if (video.bit_rate && Array.isArray(video.bit_rate)) {
                bitRates = bitRates.concat(video.bit_rate);
            }
        });
    }
    
    console.log('提取到的bit_rates:', bitRates);
    
    // 辅助函数：强制转换链接为https://www.douyin.com/aweme/v1/play/?video_id格式
    function convertToDouyinUrl(url, videoId) {
        try {
            // 无论原始链接是什么，都尝试提取参数并构建标准链接
            const urlObj = new URL(url);
            
            // 优先从URL参数中提取video_id
            let videoIdParam = urlObj.searchParams.get('video_id');
            
            // 如果URL参数中没有video_id，尝试使用传入的videoId或从URL路径中提取
            if (!videoIdParam && videoId) {
                videoIdParam = videoId;
            } else if (!videoIdParam) {
                // 尝试从URL路径中提取可能的视频ID
                const pathParts = urlObj.pathname.split('/').filter(Boolean);
                // 尝试匹配路径中的数字ID
                const idMatch = pathParts.find(part => /^\d{18,19}$/.test(part));
                if (idMatch) {
                    videoIdParam = idMatch;
                }
            }
            
            // 提取其他重要参数
            const fileId = urlObj.searchParams.get('file_id');
            const sign = urlObj.searchParams.get('sign');
            const ts = urlObj.searchParams.get('ts') || Math.floor(Date.now() / 1000).toString();
            
            if (videoIdParam) {
                // 构建标准的https://www.douyin.com/aweme/v1/play/?video_id=格式链接
                let newUrl = `https://www.douyin.com/aweme/v1/play/?video_id=${videoIdParam}`;
                if (fileId) newUrl += `&file_id=${fileId}`;
                if (sign) newUrl += `&sign=${sign}`;
                newUrl += `&ts=${ts}&is_play_url=1&source=PackSourceEnum_AWEME_DETAIL`;
                
                console.log('转换URL为标准格式:', newUrl);
                return newUrl;
            }
            
            // 如果无法提取video_id，生成一个带有默认参数的标准链接
            console.warn('无法从URL中提取video_id，使用默认参数生成标准格式链接:', url);
            const fallbackUrl = `https://www.douyin.com/aweme/v1/play/?video_id=default&ts=${Math.floor(Date.now() / 1000)}&is_play_url=1&source=PackSourceEnum_AWEME_DETAIL`;
            return fallbackUrl;
        } catch (error) {
            // 处理URL解析错误
            console.error('URL解析错误:', error.message);
            // 即使出错，也返回一个标准格式的链接
            return `https://www.douyin.com/aweme/v1/play/?video_id=error&ts=${Math.floor(Date.now() / 1000)}&is_play_url=1&source=PackSourceEnum_AWEME_DETAIL`;
        }
    }
    
    // 根据Python脚本的逻辑提取下载选项
    function extractDownloadOptions(videoDetail, bitRates, videoFPS) {
        const options = [];
        
        // 尝试从视频详情中提取video_id
        let videoId = null;
        if (videoDetail && videoDetail.video) {
            videoId = videoDetail.video.video_id || 
                     videoDetail.video.play_addr && videoDetail.video.play_addr.uri;
        }
        if (!videoId && videoDetail) {
            videoId = videoDetail.video_id || 
                     videoDetail.play_addr && videoDetail.play_addr.uri;
        }
        
        console.log('提取到的video_id:', videoId);
        
        // 1. 从bit_rate数组获取（优先处理）- 与Python脚本逻辑保持一致
        if (Array.isArray(bitRates) && bitRates.length > 0) {
            console.log('处理bit_rates数组，共', bitRates.length, '个选项');
            
            bitRates.forEach((bitRate, index) => {
                console.log(`处理bit_rate[${index}]:`, bitRate);
                
                if (bitRate.play_addr && bitRate.play_addr.url_list && Array.isArray(bitRate.play_addr.url_list)) {
                    const playAddr = bitRate.play_addr;
                    const height = playAddr.height || 0;
                    const width = playAddr.width || 0;
                    const fps = bitRate.FPS || bitRate.fps || videoFPS;
                    
                    console.log(`bit_rate[${index}] 信息:`, {
                        height, width, fps,
                        url_count: playAddr.url_list.length,
                        urls: playAddr.url_list
                    });
                    
                    // 按照Python脚本的逻辑：优先选择以"https://www.douyin.com"开头的链接
                    let priorityUrl = null;
                    
                    // 首先尝试找到以https://www.douyin.com开头的链接
                    const douyinUrl = playAddr.url_list.find(url => 
                        url && url.startsWith("https://www.douyin.com")
                    );
                    
                    if (douyinUrl) {
                        priorityUrl = douyinUrl;
                        console.log(`找到抖音标准链接: ${priorityUrl}`);
                    } else if (playAddr.url_list.length > 0) {
                        // 如果没有找到标准链接，转换第一个链接
                        priorityUrl = convertToDouyinUrl(playAddr.url_list[0], videoId);
                        console.log(`转换链接为抖音格式: ${priorityUrl}`);
                    }
                    
                    if (priorityUrl) {
                        const option = {
                            url: priorityUrl,
                            quality: getResolutionTag(height, width),
                            size: playAddr.data_size || bitRate.size,
                            frameRate: fps,
                            bitRate: bitRate.bit_rate,
                            height: height,
                            width: width,
                            format: bitRate.format || 'mp4',
                            gearName: bitRate.gear_name || '',
                            qualityType: bitRate.quality_type || 0
                        };
                        
                        options.push(option);
                        console.log(`添加下载选项[${index}]:`, option);
                    }
                }
            });
        }
        
        // 2. 从其他位置获取视频链接（兼容处理） - 遵循Python脚本的链接筛选逻辑
        if (options.length === 0) {
            console.log('bit_rates为空，尝试从其他位置获取链接');
            
            // 辅助函数：尝试从特定位置获取链接，强制转换为https://www.douyin.com/aweme/v1/play/?video_id=格式
            const tryAddLinksFromSource = (source, qualityLabel) => {
                if (!source || !source.url_list || !Array.isArray(source.url_list)) {
                    return false;
                }
                
                // 强制转换所有链接为https://www.douyin.com/aweme/v1/play/?video_id=格式
                let priorityUrl = null;
                if (source.url_list.length > 0) {
                    // 无论原始链接是什么格式，都转换为标准抖音格式
                    priorityUrl = convertToDouyinUrl(source.url_list[0], videoId);
                }
                
                if (priorityUrl) {
                    options.push({
                        url: priorityUrl,
                        quality: qualityLabel,
                        size: source.data_size,
                        frameRate: extractFrameRate(videoDetail),
                        bitRate: videoDetail.bit_rate || (videoDetail.video && videoDetail.video.bit_rate),
                        height: source.height || (videoDetail.height || (videoDetail.video && videoDetail.video.height)),
                        width: source.width || (videoDetail.width || (videoDetail.video && videoDetail.video.width))
                    });
                    return true;
                }
                return false;
            };
            
            // 按优先级尝试从不同位置获取链接
            // 1. 从video.download_addr获取（无水印链接）
            if (videoDetail.video && videoDetail.video.download_addr) {
                if (tryAddLinksFromSource(videoDetail.video.download_addr, '无水印')) {
                    return options; // 成功获取后直接返回
                }
            }
            
            // 2. 从download_addr获取
            if (videoDetail.download_addr) {
                if (tryAddLinksFromSource(videoDetail.download_addr, '无水印')) {
                    return options; // 成功获取后直接返回
                }
            }
            
            // 3. 从video.play_addr获取
            if (videoDetail.video && videoDetail.video.play_addr) {
                if (tryAddLinksFromSource(videoDetail.video.play_addr, '原画')) {
                    return options; // 成功获取后直接返回
                }
            }
            
            // 4. 从play_addr获取
            if (videoDetail.play_addr) {
                tryAddLinksFromSource(videoDetail.play_addr, '原画');
            }
        }
        
        // 按照Python脚本的逻辑排序：以分辨率为优先级排序（长边）
        options.sort((a, b) => {
            const aLongSide = Math.max(a.height || 0, a.width || 0);
            const bLongSide = Math.max(b.height || 0, b.width || 0);
            if (aLongSide !== bLongSide) {
                return bLongSide - aLongSide; // 从高到低排序
            }
            // 分辨率相同，比较帧率
            return (b.frameRate || 0) - (a.frameRate || 0);
        });
        
        console.log('最终下载选项（已排序）:', options);
        
        // 去重，避免重复的下载选项
        const uniqueOptions = [];
        const urls = new Set();
        options.forEach(option => {
            if (!urls.has(option.url)) {
                urls.add(option.url);
                uniqueOptions.push(option);
            }
        });
        
        console.log('去重后的下载选项:', uniqueOptions);
        return uniqueOptions;
    }
    
    // 根据Python脚本的逻辑获取分辨率标签
    function getResolutionTag(height, width = null) {
        if (width === null) {
            return `${height}p`;
        }
        
        const longSide = Math.max(height, width);
        
        if (longSide >= 3840) {
            return "4K";
        } else if (longSide >= 2560) {
            return "2K";
        } else if (longSide >= 1920) {
            return "1080p";
        } else if (longSide >= 1280) {
            return "720p";
        } else if (longSide >= 854) {
            return "480p";
        } else {
            return `${longSide}p`;
        }
    }
    
    // 提取帧率信息
    function extractFrameRate(metadata) {
        if (!metadata) return null;
        
        // 尝试从不同字段获取帧率
        if (metadata.fps) return metadata.fps;
        if (metadata.frame_rate) return metadata.frame_rate;
        if (metadata.video && metadata.video.fps) return metadata.video.fps;
        if (metadata.video && metadata.video.frame_rate) return metadata.video.frame_rate;
        
        // 如果有duration和total_frames，可以计算帧率
        if (metadata.duration && metadata.total_frames) {
            return Math.round(metadata.total_frames / (metadata.duration / 1000));
        }
        
        return null;
    }
    
    // 根据Python脚本的逻辑生成安全的文件名
    function generateFilename(data, rate, fps) {
        const createTime = data.create_time || 0;
        let dateStr = "unknown_date";
        
        if (createTime) {
            const date = new Date(createTime * 1000);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
        }
        
        const authorName = data.author ? 
            data.author.nickname.replace(/[\\/:*?"<>|]/g, '') : '未知作者';
        
        const desc = data.desc ? 
            data.desc.replace(/[\\/:*?"<>|\s]/g, '_').substring(0, 50) : '视频';
        
        const height = rate.height || 0;
        const width = rate.width || 0;
        const resolutionTag = getResolutionTag(height, width).replace(/[()]/g, '');
        
        return `${dateStr}-视频-${authorName}-${desc}-${resolutionTag}-${fps}fps.mp4`;
    }
    
    
    // 提取下载选项
    const downloadOptions = extractDownloadOptions(videoDetail, bitRates, videoFPS);
    
    if (!downloadOptions || downloadOptions.length === 0) {
        // 记录详细错误信息，便于调试
        console.error('generateDownloadOptions - 未能找到可用的下载链接:', {
            hasBitRate: !!videoDetail.bit_rate,
            hasPlayAddr: !!(videoDetail.play_addr || (videoDetail.video && videoDetail.video.play_addr)),
            hasDownloadAddr: !!(videoDetail.download_addr || (videoDetail.video && videoDetail.video.download_addr)),
            hasVideoList: !!videoDetail.video_list,
            hasDownloadList: !!videoDetail.download_list
        });
        return '<p class="error-message">未能找到可用的下载链接</p>';
    }
    
    // 以分辨率和帧率为优先级排序下载选项
    downloadOptions.sort((a, b) => {
        // 优先比较分辨率（长边）
        const aLongSide = Math.max(a.height || 0, a.width || 0);
        const bLongSide = Math.max(b.height || 0, b.width || 0);
        if (aLongSide !== bLongSide) {
            return bLongSide - aLongSide;
        }
        
        // 分辨率相同，比较帧率
        return (b.frameRate || 0) - (a.frameRate || 0);
    });
    
    // 生成下载选项HTML
    let optionsHtml = '<div class="download-links">';
    
    downloadOptions.forEach((option, index) => {
        // 生成文件名
        const filename = generateFilename(videoDetail, option, option.frameRate || videoFPS);
        
        // 构建画质和帧率信息，只显示存在的值
        let qualityInfo = [];
        
        if (option.quality) {
            qualityInfo.push(option.quality);
        }
        
        if (option.frameRate) {
            qualityInfo.push(`${option.frameRate}fps`);
        }
        
        if (option.bitRate) {
            qualityInfo.push(`${Math.round(option.bitRate / 1000)}kbps`);
        }
        
        if (option.width && option.height) {
            qualityInfo.push(`${option.width}x${option.height}`);
        }
        
        // 添加格式信息
        if (option.format) {
            qualityInfo.push(option.format.toUpperCase());
        }
        
        // 生成最终的链接显示文本
        const displayText = qualityInfo.join(' · ') || '视频';
        const sizeText = option.size ? formatFileSize(option.size) : '未知大小';
        
        // 添加点击事件处理函数，支持前端下载
        optionsHtml += `
            <a href="${option.url}" class="download-link" 
               download="${filename}" onclick="handleDownload(this, event, '${option.url}', '${filename}')">
                ${index + 1}. ${displayText} (${sizeText})
            </a>
        `;
    });
    
    optionsHtml += '</div>';
    return optionsHtml;
}