// ==================== 短链接重定向处理模块 ====================

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

// 处理抖音短链接的重定向 - 集成Cloudflare Workers
function handleShortLinkRedirect(shortLink, callback) {
    console.log('开始智能重定向处理:', shortLink);

    // 检查频率限制
    rateLimiter.restoreRequests();
    const rateCheck = rateLimiter.canMakeRequest();

    if (!rateCheck.allowed) {
        const minutes = Math.floor(rateCheck.remainingTime / 60);
        const seconds = rateCheck.remainingTime % 60;

        let timeMessage = '';
        if (minutes > 0) {
            timeMessage = `${minutes}分${seconds}秒`;
        } else {
            timeMessage = `${seconds}秒`;
        }

        alert(`解析频率受限：每分钟只能解析3次，请等待${timeMessage}后再试。`);
        return;
    }
    
    // 检查是否在本地环境运行
    const isLocalEnvironment = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1' || 
                              window.location.hostname === '0.0.0.0';
    
    if (isLocalEnvironment) {
        // 本地环境优先使用Express.js服务器
        console.log('检测到本地环境，使用Express.js服务器处理重定向');
        tryLocalServerRedirect(shortLink, callback);
    } else {
        // 非本地环境使用Cloudflare Workers
        tryCloudflareWorkers(shortLink, callback);
    }
}

// 尝试使用本地Express.js服务器处理重定向
function tryLocalServerRedirect(shortLink, callback) {
    console.log('尝试使用本地Express.js服务器处理重定向:', shortLink);
    
    const localApiUrl = `/api/redirect?url=${encodeURIComponent(shortLink)}`;
    
    fetch(localApiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        console.log('本地服务器响应状态:', response.status);
        if (!response.ok) {
            throw new Error(`本地服务器请求失败: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('本地服务器响应数据:', data);
        
        if (data.url) {
            console.log('本地服务器成功获取重定向URL:', data.url);
            callback(data.url);
        } else {
            console.log('本地服务器无法处理，尝试智能重定向处理器');
            // 备用方案：使用智能重定向处理器
            if (typeof window.smartRedirectHandler !== 'undefined') {
                window.smartRedirectHandler.handleRedirect(shortLink, callback);
            } else {
                showSimpleGuidance(shortLink, callback);
            }
        }
    })
    .catch(error => {
        console.error('本地服务器请求出错:', error.message);
        console.log('本地服务器不可用，使用智能重定向处理器');
        // 本地服务器失败，使用智能重定向处理器
        if (typeof window.smartRedirectHandler !== 'undefined') {
            window.smartRedirectHandler.handleRedirect(shortLink, callback);
        } else {
            showSimpleGuidance(shortLink, callback);
        }
    });
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
