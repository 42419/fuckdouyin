// ==================== 浏览器检测模块 ====================
// 检测是否为抖音内置浏览器并提供相关提示

// 检测是否为抖音内置浏览器
function isDouyinBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // 抖音浏览器特征字符串
    const douyinPatterns = [
        'aweme',           // 抖音App
        'tiktok',          // TikTok
        'musically',       // Musical.ly（抖音前身）
        'bytedance',       // 字节跳动
        'douyin',          // 抖音
        'aweme-internal',  // 抖音内部版本
        'aweme-download'   // 抖音下载相关
    ];
    
    // 检查用户代理字符串是否包含抖音特征
    for (const pattern of douyinPatterns) {
        if (userAgent.includes(pattern)) {
            return true;
        }
    }
    
    // 检查特定的抖音浏览器标识
    if (userAgent.includes('aweme') && userAgent.includes('version')) {
        return true;
    }
    
    // 检查抖音WebView特征
    if (userAgent.includes('webview') && 
        (userAgent.includes('aweme') || userAgent.includes('douyin'))) {
        return true;
    }
    
    return false;
}

// 显示抖音浏览器提示
function showDouyinBrowserHint() {
    if (!isDouyinBrowser()) return;
    
    // 创建提示元素
    const hintElement = document.createElement('div');
    hintElement.className = 'douyin-browser-hint';
    hintElement.innerHTML = `
        <div class="hint-content">
            <div class="hint-icon">📱</div>
            <div class="hint-text">
                <strong>检测到您在抖音浏览器中访问</strong>
                <p>为了更好的体验，建议在系统浏览器中打开此页面</p>
            </div>
            <button class="hint-close">×</button>
        </div>
    `;
    
    // 添加样式
    hintElement.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100%);
        background: linear-gradient(135deg, #ff0050, #ff6b9d);
        color: white;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 8px 32px rgba(255, 0, 80, 0.3);
        z-index: 9999;
        max-width: 400px;
        width: 90%;
        opacity: 0;
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    
    const hintContent = hintElement.querySelector('.hint-content');
    hintContent.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: space-between;
    `;
    
    const hintIcon = hintElement.querySelector('.hint-icon');
    hintIcon.style.cssText = `
        font-size: 24px;
        flex-shrink: 0;
        animation: iconBounce 2s infinite;
    `;
    
    const hintText = hintElement.querySelector('.hint-text');
    hintText.style.cssText = `
        flex: 1;
        margin: 0;
    `;
    
    hintText.querySelector('strong').style.cssText = `
        display: block;
        margin-bottom: 4px;
        font-size: 14px;
    `;
    
    hintText.querySelector('p').style.cssText = `
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
        line-height: 1.4;
    `;
    
    const hintClose = hintElement.querySelector('.hint-close');
    hintClose.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.3s ease;
    `;
    
    hintClose.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255, 255, 255, 0.3)';
        this.style.transform = 'scale(1.1)';
    });
    
    hintClose.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255, 255, 255, 0.2)';
        this.style.transform = 'scale(1)';
    });
    
    // 关闭按钮点击事件
    hintClose.addEventListener('click', function() {
        hideDouyinHint(hintElement);
    });
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInDown {
            0% {
                transform: translate(-50%, -100%);
                opacity: 0;
            }
            70% {
                transform: translate(-50%, 10px);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, 0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutUp {
            0% {
                transform: translate(-50%, 0);
                opacity: 1;
            }
            30% {
                transform: translate(-50%, -10px);
                opacity: 0.8;
            }
            100% {
                transform: translate(-50%, -100%);
                opacity: 0;
            }
        }
        
        @keyframes iconBounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-5px);
            }
            60% {
                transform: translateY(-3px);
            }
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 8px 32px rgba(255, 0, 80, 0.3);
            }
            50% {
                box-shadow: 0 12px 40px rgba(255, 0, 80, 0.5);
            }
            100% {
                box-shadow: 0 8px 32px rgba(255, 0, 80, 0.3);
            }
        }
        
        .douyin-browser-hint.show {
            animation: slideInDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .douyin-browser-hint.hide {
            animation: slideOutUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .douyin-browser-hint.show {
            animation: pulse 2s infinite;
        }
    `;
    document.head.appendChild(style);
    
    // 添加到页面
    document.body.appendChild(hintElement);
    
    // 延迟显示动画，确保元素已添加到DOM
    setTimeout(() => {
        hintElement.classList.add('show');
        hintElement.style.transform = 'translateX(-50%) translateY(0)';
        hintElement.style.opacity = '1';
    }, 50);
    
    // 5秒后自动关闭
    setTimeout(() => {
        hideDouyinHint(hintElement);
    }, 5000);
}

// 隐藏抖音浏览器提示
function hideDouyinHint(hintElement) {
    if (!hintElement || !hintElement.parentNode) return;

    hintElement.classList.remove('show');
    hintElement.classList.add('hide');

    // 动画完成后移除元素
    setTimeout(() => {
        if (hintElement.parentNode) {
            hintElement.parentNode.removeChild(hintElement);
        }
    }, 600);
}

// 获取浏览器详细信息
function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    const isDouyin = isDouyinBrowser();
    
    return {
        userAgent: userAgent,
        isDouyinBrowser: isDouyin,
        browserName: isDouyin ? '抖音浏览器' : getBrowserName(userAgent),
        platform: navigator.platform,
        language: navigator.language
    };
}

// 获取普通浏览器名称
function getBrowserName(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return '未知浏览器';
}
