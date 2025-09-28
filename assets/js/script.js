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

function toggleMenu() {
    const banner = document.getElementById('banner');
    const button = document.querySelector('.menu-toggle');
    banner.classList.toggle('active');
    button.classList.toggle('active');
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const autoTheme = localStorage.getItem('autoTheme') === 'true';
    
    if (autoTheme) {
        // 如果当前是自动模式，切换到手动模式并使用与当前系统主题相反的主题
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const newTheme = systemPrefersDark ? 'light' : 'dark';
        
        localStorage.setItem('autoTheme', 'false');
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeColors(newTheme);
        updateThemeToggleIcon();
        
        // 显示提示信息
        showAutoModeHint('已切换到手动模式，长按或右键可重新启用自动模式');
    } else {
        // 手动切换主题
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeColors(newTheme);
        updateThemeToggleIcon();
    }
}

// 切换自动/手动主题模式
function toggleAutoTheme() {
    const autoTheme = localStorage.getItem('autoTheme') === 'true';
    const newAutoTheme = !autoTheme;
    
    localStorage.setItem('autoTheme', newAutoTheme);
    
    if (newAutoTheme) {
        // 切换到自动模式，立即应用系统主题
        applySystemTheme();
        showAutoModeHint('已启用自动模式，将跟随系统主题变化');
    } else {
        showAutoModeHint('已切换到手动模式');
    }
    
    updateThemeToggleIcon();
}

// 处理移动设备触摸事件
let touchStartTime = 0;
let touchTimer = null;

function handleThemeTouch(event) {
    // 阻止默认行为
    event.preventDefault();
    
    // 记录触摸开始时间
    touchStartTime = Date.now();
    
    // 设置长按计时器
    touchTimer = setTimeout(() => {
        // 长按事件：切换自动/手动模式
        toggleAutoTheme();
        touchTimer = null;
    }, 500); // 500毫秒长按
}

// 添加触摸结束事件监听
document.addEventListener('touchend', function(event) {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle && themeToggle.contains(event.target)) {
        // 清除长按计时器
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
        
        // 如果是短按（小于500ms），执行普通点击
        const touchDuration = Date.now() - touchStartTime;
        if (touchDuration < 500) {
            toggleTheme();
        }
    }
});

// 添加触摸取消事件监听
document.addEventListener('touchcancel', function(event) {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle && themeToggle.contains(event.target)) {
        // 清除长按计时器
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
    }
});

// 显示自动模式提示信息
function showAutoModeHint(message) {
    // 创建提示元素
    const hintElement = document.createElement('div');
    hintElement.className = 'auto-mode-hint';
    hintElement.innerHTML = `
        <div class="hint-content">
            <span>${message}</span>
            <button class="hint-close">×</button>
        </div>
    `;
    
    // 添加样式
    hintElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-card);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: var(--shadow);
        z-index: 1000;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    const hintContent = hintElement.querySelector('.hint-content');
    hintContent.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: var(--text-color);
    `;
    
    const hintClose = hintElement.querySelector('.hint-close');
    hintClose.style.cssText = `
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: var(--text-light);
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    `;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .hint-close:hover {
            background: var(--glass-border);
        }
    `;
    document.head.appendChild(style);
    
    // 添加到页面
    document.body.appendChild(hintElement);
    
    // 触摸滑动关闭功能（手机端）
    let touchStartY = 0;
    let touchStartTime = 0;
    
    hintElement.addEventListener('touchstart', function(e) {
        e.stopPropagation(); // 阻止事件冒泡
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        hintElement.style.transition = 'none'; // 禁用过渡效果，实现流畅跟随
    }, { passive: false });
    
    hintElement.addEventListener('touchmove', function(e) {
        if (!touchStartY) return;
        
        e.stopPropagation(); // 阻止事件冒泡
        e.preventDefault(); // 阻止默认滚动行为
        
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY; // 上滑为正值
        
        if (deltaY > 0) { // 只处理上滑
            const translateY = Math.min(deltaY, 100); // 限制最大滑动距离
            hintElement.style.transform = `translateY(-${translateY}px)`;
            hintElement.style.opacity = Math.max(0.3, 1 - translateY / 100); // 随滑动淡出
        }
    }, { passive: false });
    
    hintElement.addEventListener('touchend', function(e) {
        if (!touchStartY) return;
        
        e.stopPropagation(); // 阻止事件冒泡
        
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        const touchDuration = Date.now() - touchStartTime;
        
        // 判断是否满足上滑关闭条件：滑动距离大于30px且速度较快
        if (deltaY > 30 && (deltaY / touchDuration) > 0.1) {
            // 上滑关闭
            hintElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            hintElement.style.transform = 'translateY(-100px)';
            hintElement.style.opacity = '0';
            
            setTimeout(() => {
                if (hintElement.parentNode) {
                    hintElement.parentNode.removeChild(hintElement);
                }
            }, 300);
        } else {
            // 不满足条件，恢复原位置
            hintElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            hintElement.style.transform = 'translateY(0)';
            hintElement.style.opacity = '1';
        }
        
        // 重置触摸状态
        touchStartY = 0;
        touchStartTime = 0;
    }, { passive: false });
    
    // 关闭按钮事件
    hintClose.addEventListener('click', function() {
        hintElement.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            if (hintElement.parentNode) {
                hintElement.parentNode.removeChild(hintElement);
            }
        }, 300);
    });
    
    // 3秒后自动消失
    setTimeout(() => {
        if (hintElement.parentNode) {
            hintElement.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (hintElement.parentNode) {
                    hintElement.parentNode.removeChild(hintElement);
                }
            }, 300);
        }
    }, 3000);
}

// 应用系统主题
function applySystemTheme() {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = systemPrefersDark ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', theme);
    updateThemeColors(theme);
    updateThemeToggleIcon();
}

// 更新主题切换图标
function updateThemeToggleIcon() {
    const themeToggle = document.querySelector('.theme-toggle');
    const autoTheme = localStorage.getItem('autoTheme') === 'true';
    const currentTheme = document.body.getAttribute('data-theme');
    
    if (!themeToggle) return;
    
    // 清除现有图标
    themeToggle.innerHTML = '';
    
    if (autoTheme) {
        // 自动模式图标
        themeToggle.innerHTML = `
            <svg t="1758784373742" class="icon" viewBox="0 0 1024 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="1520" width="200" height="200">
                <path
                    d="M512 0a512 512 0 1 1 0 1024A512 512 0 0 1 512 0z m0 128a384 384 0 1 0 0 768A384 384 0 0 0 512 128z"
                    fill="currentColor" p-id="1521"></path>
                <path d="M512 256a256 256 0 0 1 12.8 511.68L512 768V256z" fill="currentColor" p-id="1522">
                </path>
            </svg>
            <span class="auto-indicator">自动</span>
        `;
    } else {
        // 手动模式图标
        if (currentTheme === 'dark') {
            // 暗色模式图标（太阳）
            themeToggle.innerHTML = `
                <svg t="1758784373742" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="1520" width="200" height="200">
                    <path
                        d="M512 0a512 512 0 1 1 0 1024A512 512 0 0 1 512 0z m0 128a384 384 0 1 0 0 768A384 384 0 0 0 512 128z"
                        fill="currentColor" p-id="1521"></path>
                    <path d="M512 256a256 256 0 0 1 12.8 511.68L512 768V256z" fill="currentColor" p-id="1522">
                    </path>
                </svg>
            `;
        } else {
            // 亮色模式图标（月亮）
            themeToggle.innerHTML = `
                <svg t="1758784373742" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="1520" width="200" height="200">
                    <path
                        d="M512 0a512 512 0 1 1 0 1024A512 512 0 0 1 512 0z m0 128a384 384 0 1 0 0 768A384 384 0 0 0 512 128z"
                        fill="currentColor" p-id="1521"></path>
                    <path d="M512 256a256 256 0 0 1 12.8 511.68L512 768V256z" fill="currentColor" p-id="1522">
                    </path>
                </svg>
            `;
        }
    }
}

function updateThemeColors(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.style.setProperty('--text-color', '#ffffff');
        root.style.setProperty('--text-light', '#d1d5db');
        root.style.setProperty('--bg-header', '#1A1A1A');
        root.style.setProperty('--bg-menu', '#2D2A2E');
        root.style.setProperty('--bg-main', '#1A1A1A');
        root.style.setProperty('--bg-card', '#2D2A2E');
        root.style.setProperty('--glass-bg', 'rgba(45, 42, 46, 0.8)');
        root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--shadow', '0 8px 32px rgba(0, 0, 0, 0.3)');
        root.style.setProperty('--shadow-hover', '0 12px 40px rgba(0, 0, 0, 0.4)');
        root.style.setProperty('--shadow-card', '0 4px 20px rgba(0, 0, 0, 0.2)');
        
        // 更新内容框字体样式 - 暗色模式
        root.style.setProperty('--update-modal-text-color', '#ffffff');
        root.style.setProperty('--update-modal-text-light', '#d1d5db');
        root.style.setProperty('--update-modal-title-color', '#ffffff');
        root.style.setProperty('--update-modal-list-color', '#d1d5db');
        root.style.setProperty('--update-modal-new-color', '#ffffff');
        root.style.setProperty('--update-modal-improve-color', '#ffffff');
        root.style.setProperty('--update-modal-fix-color', '#ffffff');
        root.style.setProperty('--update-modal-remove-color', '#d1d5db');
        root.style.setProperty('--update-modal-text-bg-color', 'rgba(45, 42, 46, 0.8)');
    } else {
        root.style.setProperty('--text-color', '#2D2A2E');
        root.style.setProperty('--text-light', '#6D6B6E');
        root.style.setProperty('--bg-header', '#FFFCEE');
        root.style.setProperty('--bg-menu', '#FFFDF5');
        root.style.setProperty('--bg-main', '#FFFCEE');
        root.style.setProperty('--bg-card', '#FFFCEE');
        root.style.setProperty('--glass-bg', 'rgba(255, 252, 238, 0.9)');
        root.style.setProperty('--glass-border', 'rgba(45, 42, 46, 0.1)');
        root.style.setProperty('--shadow', '0 8px 32px rgba(45, 42, 46, 0.1)');
        root.style.setProperty('--shadow-hover', '0 12px 40px rgba(45, 42, 46, 0.15)');
        root.style.setProperty('--shadow-card', '0 4px 20px rgba(45, 42, 46, 0.08)');
        
        // 更新内容框字体样式 - 亮色模式
        root.style.setProperty('--update-modal-text-color', '#2D2A2E');
        root.style.setProperty('--update-modal-text-light', '#6D6B6E');
        root.style.setProperty('--update-modal-title-color', '#7B3306');
        root.style.setProperty('--update-modal-list-color', '#6D6B6E');
        root.style.setProperty('--update-modal-new-color', '#2D2A2E');
        root.style.setProperty('--update-modal-improve-color', '#2D2A2E');
        root.style.setProperty('--update-modal-fix-color', '#2D2A2E');
        root.style.setProperty('--update-modal-remove-color', '#6D6B6E');
        root.style.setProperty('--update-modal-text-bg-color', 'rgba(255, 252, 238, 0.9)');
    }
}

function initTheme() {
    // 强制设置为自动模式，忽略之前的设置
    localStorage.setItem('autoTheme', 'true');
    
    // 始终监听系统主题变化，但只有在自动模式下才响应
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 使用兼容性更好的监听方式
    const handleThemeChange = function(e) {
        if (localStorage.getItem('autoTheme') === 'true') {
            applySystemTheme();
        }
    };
    
    // 尝试使用现代API
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleThemeChange);
    } else if (mediaQuery.addListener) {
        // 兼容旧浏览器
        mediaQuery.addListener(handleThemeChange);
    }
    
    // 定期检查系统主题变化（作为备用方案）
    setInterval(() => {
        if (localStorage.getItem('autoTheme') === 'true') {
            const currentSystemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            const currentTheme = document.body.getAttribute('data-theme');
            
            if (currentSystemTheme !== currentTheme) {
                applySystemTheme();
            }
        }
    }, 5000); // 每5秒检查一次
    
    // 总是应用系统主题（自动模式）
    applySystemTheme();
    
    // 更新主题切换图标
    updateThemeToggleIcon();
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    setActiveNavItem();
});

// 处理前端下载 - 直接下载版
// 增强的前端下载处理函数
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
        
        const response = await fetch(workerProxyUrl, {
            method: 'GET',
            headers: {
                'Accept': '*/*'
            }
        });
        
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
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }
            
            chunks.push(value);
            loaded += value.length;
            updateProgress();
        }
        
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
// 此函数已定义过，无需重复定义

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

// 更新检测和提示功能
let currentVersion = '1.0.0'; // 当前版本号

// 检查更新
async function checkForUpdates(forceShow = false) {
    try {
        // 获取版本信息，添加时间戳和版本戳避免缓存
        const response = await fetch('/version.json?v=' + Date.now() + '&version=1.1.3');
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const versionInfo = await response.json();
        
        // 检查本地存储的版本号
        const lastVersion = localStorage.getItem('app_version');
        const lastUpdateTime = localStorage.getItem('last_update_check');
        const cssVersion = localStorage.getItem('css_version');
        
        // 检查CSS版本，如果CSS版本不同，强制刷新页面
        if (cssVersion !== '1.1.3') {
            localStorage.setItem('css_version', '1.1.3');
            // 如果CSS版本变化，强制重新加载页面以获取最新样式
            if (cssVersion) {
                window.location.reload();
                return;
            }
        }
        
        // 如果是第一次访问或版本不同，显示更新提示
        if (!lastVersion || lastVersion !== versionInfo.version || forceShow) {
            // 显示更新提示
            showUpdateModal(versionInfo);
            
            // 更新本地存储
            localStorage.setItem('app_version', versionInfo.version);
            localStorage.setItem('last_update_check', Date.now().toString());
        } else {
            // 检查是否需要重新获取最新版本（每24小时检查一次）
            const oneDay = 24 * 60 * 60 * 1000;
            if (!lastUpdateTime || Date.now() - parseInt(lastUpdateTime) > oneDay) {
                localStorage.setItem('last_update_check', Date.now().toString());
            }
        }
        
        currentVersion = versionInfo.version;
        
        // 更新页面底部显示的版本号
        updateVersionDisplay(versionInfo.version);
        
    } catch (error) {
        console.log('版本检查失败:', error);
        // 如果版本文件不存在，设置默认版本
        if (!localStorage.getItem('app_version')) {
            localStorage.setItem('app_version', currentVersion);
        }
        // 使用默认版本更新显示
        updateVersionDisplay(currentVersion);
    }
}

// 更新页面底部版本号显示
function updateVersionDisplay(version) {
    const versionLink = document.getElementById('versionLink');
    if (versionLink) {
        versionLink.textContent = `v${version}`;
    }
}

// 显示更新提示弹窗
function showUpdateModal(versionInfo) {
    const modal = document.getElementById('updateModal');
    const changelogList = document.getElementById('updateChangelog');
    
    if (modal && changelogList) {
        // 清空之前的更新日志
        changelogList.innerHTML = '';
        
        // 检查是否有历史版本信息
        if (versionInfo.history && versionInfo.history.length > 0) {
            // 按版本号降序排列（从高到低）
            const sortedHistory = versionInfo.history.sort((a, b) => {
                return compareVersions(b.version, a.version);
            });
            
            // 显示所有历史更新信息
            sortedHistory.forEach(version => {
                // 创建版本标题
                const versionTitle = document.createElement('div');
                versionTitle.className = 'version-title';
                // 格式化日期：从ISO格式转换为YYYY-MM-DD
                const buildDate = version.build_date ? new Date(version.build_date).toISOString().split('T')[0] : '';
                versionTitle.innerHTML = `<strong>v${version.version}${buildDate ? ` (${buildDate})` : ''}</strong>`;
                changelogList.appendChild(versionTitle);
                
                // 创建更新列表
            const versionList = document.createElement('ul');
            versionList.className = 'version-changelog';
            
            version.changelog.forEach(item => {
                const li = document.createElement('li');
                
                // 根据内容类型添加不同的样式类
                if (item.trim() === '') {
                    // 空行，添加分隔样式
                    li.className = 'changelog-separator';
                } else if (item.includes('===') || item.includes('【')) {
                    // 标题或章节标题
                    li.className = 'changelog-title';
                    li.textContent = item;
                } else if (item.startsWith('•')) {
                    // 列表项
                    li.className = 'changelog-list-item';
                    li.innerHTML = `<span class="list-bullet">•</span>${item.substring(1)}`;
                } else if (item.includes('新增') || item.includes('新功能') || item.includes('增加')) {
                    // 新增功能
                    li.className = 'changelog-new';
                    li.innerHTML = `<span class="changelog-icon new-icon">✨</span>${item}`;
                } else if (item.includes('优化') || item.includes('改进') || item.includes('提升') || item.includes('增强')) {
                    // 优化改进
                    li.className = 'changelog-improve';
                    li.innerHTML = `<span class="changelog-icon improve-icon">⚡</span>${item}`;
                } else if (item.includes('修复') || item.includes('解决') || item.includes('更正')) {
                    // 修复问题
                    li.className = 'changelog-fix';
                    li.innerHTML = `<span class="changelog-icon fix-icon">🐛</span>${item}`;
                } else if (item.includes('删除') || item.includes('移除')) {
                    // 删除功能
                    li.className = 'changelog-remove';
                    li.innerHTML = `<span class="changelog-icon remove-icon">🗑️</span>${item}`;
                } else {
                    // 普通文本
                    li.className = 'changelog-text';
                    li.textContent = item;
                }
                
                versionList.appendChild(li);
            });
                
                changelogList.appendChild(versionList);
            });
        } else {
            // 如果没有历史信息，显示当前版本的更新日志
            const currentTitle = document.createElement('div');
            currentTitle.className = 'version-title';
            // 格式化日期：从ISO格式转换为YYYY-MM-DD
            const buildDate = versionInfo.build_date ? new Date(versionInfo.build_date).toISOString().split('T')[0] : '';
            currentTitle.innerHTML = `<strong>v${versionInfo.version}${buildDate ? ` (${buildDate})` : ''}</strong>`;
            changelogList.appendChild(currentTitle);
            
            const currentList = document.createElement('ul');
            currentList.className = 'version-changelog';
            
            versionInfo.changelog.forEach(item => {
                const li = document.createElement('li');
                
                // 根据内容类型添加不同的样式类
                if (item.trim() === '') {
                    // 空行，添加分隔样式
                    li.className = 'changelog-separator';
                } else if (item.includes('===') || item.includes('【')) {
                    // 标题或章节标题
                    li.className = 'changelog-title';
                    li.textContent = item;
                } else if (item.startsWith('•')) {
                    // 列表项
                    li.className = 'changelog-list-item';
                    li.innerHTML = `<span class="list-bullet">•</span>${item.substring(1)}`;
                } else if (item.includes('新增') || item.includes('新功能') || item.includes('增加')) {
                    // 新增功能
                    li.className = 'changelog-new';
                    li.innerHTML = `<span class="changelog-icon new-icon">✨</span>${item}`;
                } else if (item.includes('优化') || item.includes('改进') || item.includes('提升') || item.includes('增强')) {
                    // 优化改进
                    li.className = 'changelog-improve';
                    li.innerHTML = `<span class="changelog-icon improve-icon">⚡</span>${item}`;
                } else if (item.includes('修复') || item.includes('解决') || item.includes('更正')) {
                    // 修复问题
                    li.className = 'changelog-fix';
                    li.innerHTML = `<span class="changelog-icon fix-icon">🐛</span>${item}`;
                } else if (item.includes('删除') || item.includes('移除')) {
                    // 删除功能
                    li.className = 'changelog-remove';
                    li.innerHTML = `<span class="changelog-icon remove-icon">🗑️</span>${item}`;
                } else {
                    // 普通文本
                    li.className = 'changelog-text';
                    li.textContent = item;
                }
                
                currentList.appendChild(li);
            });
            
            changelogList.appendChild(currentList);
        }
        
        // 显示弹窗
        modal.style.display = 'flex';
        
        // 移动端：确保动画类被移除，以便重新触发进入动画
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && window.innerWidth <= 768) {
            const modalContent = modal.querySelector('.update-modal-content');
            if (modalContent) {
                // 移除可能的关闭动画类
                modal.classList.remove('closing');
                modalContent.classList.remove('closing');
                // 强制重排以重新触发CSS动画
                void modalContent.offsetWidth;
            }
        }
        
        // 添加ESC键关闭功能
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeUpdateModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeUpdateModal();
            }
        });
    }
}

// 版本号比较函数
function compareVersions(versionA, versionB) {
    const partsA = versionA.split('.').map(part => parseInt(part, 10));
    const partsB = versionB.split('.').map(part => parseInt(part, 10));
    
    const maxLength = Math.max(partsA.length, partsB.length);
    
    for (let i = 0; i < maxLength; i++) {
        const partA = partsA[i] || 0;
        const partB = partsB[i] || 0;
        
        if (partA > partB) return 1;
        if (partA < partB) return -1;
    }
    
    return 0;
}

// 关闭更新提示弹窗
function closeUpdateModal() {
    const modal = document.getElementById('updateModal');
    const modalContent = modal ? modal.querySelector('.update-modal-content') : null;
    
    if (modal && modalContent) {
        // 检查是否为移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile && window.innerWidth <= 768) {
            // 移动端：添加关闭动画
            modal.classList.add('closing');
            modalContent.classList.add('closing');
            
            // 动画结束后隐藏弹窗
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('closing');
                modalContent.classList.remove('closing');
            }, 300); // 与CSS动画时长保持一致
        } else {
            // 桌面端：直接隐藏
            modal.style.display = 'none';
        }
    }
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
            <!-- 视频信息区域 -->
            <div class="video-details">
                <!-- 作者信息 -->
                <div class="author-info">
                    <div class="author-info-left">
                        <img src="${avatarUrl}" alt="作者头像" class="author-avatar">
                        <div class="author-details">
                            <h3>${nickname}</h3>
                            <div class="author-stats-simple">
                                <span class="stat-item-simple">
                                    <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                    <span class="stat-value-simple">${formatNumber(followerCount)}</span>
                                    <span class="stat-label-simple">粉丝</span>
                                </span>
                                <span class="stat-item-simple">
                                    <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                    </svg>
                                    <span class="stat-value-simple">${formatNumber(totalFavorited)}</span>
                                    <span class="stat-label-simple">获赞</span>
                                </span>
                            </div>
                            <div class="author-signature">
                                <span class="signature-label">简介：</span>
                                <span class="signature-text">${signature.replace(/\n/g, '<br>')}</span>
                            </div>
                        </div>
                    </div>
                    <div class="author-info-right">
                        <!-- 发布时间 -->
                        <div class="publish-time">
                            <svg t="1758971042738" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10456" width="16" height="16">
                                <path d="M512 1024c-281.6 0-512-230.4-512-512s230.4-512 512-512 512 230.4 512 512-230.4 512-512 512zM512 115.2C294.4 115.2 115.2 294.4 115.2 512c0 217.6 179.2 396.8 396.8 396.8s396.8-179.2 396.8-396.8c0-217.6-179.2-396.8-396.8-396.8z m140.8 620.8c-12.8 0-25.6-6.4-38.4-12.8L473.6 576c-12.8-6.4-19.2-25.6-19.2-38.4v-192c0-32 25.6-57.6 57.6-57.6s57.6 25.6 57.6 57.6V512l128 128c19.2 19.2 19.2 57.6 0 76.8-12.8 12.8-25.6 19.2-44.8 19.2z" fill="#646F79" p-id="10457"></path>
                            </svg>
                            <span>${createTime}</span>
                        </div>
                        
                        <!-- 视频统计数据 -->
                        <div class="video-stats">
                            <div class="stat-item">
                                <svg t="1758970854977" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5282" width="16" height="16">
                                    <path d="M411.904 153.728c19.797333-63.232 54.186667-90.24 122.026667-70.656l1.706666 0.554667c19.84 6.101333 42.666667 17.706667 64.085334 37.162666 33.706667 30.72 53.76 73.301333 53.76 126.805334 0 47.786667-2.773333 77.312-10.88 110.805333l-0.256 0.938667h175.488c107.264 0 149.888 72.362667 122.922666 192.682666l-2.304 9.856-5.461333 18.005334-20.608 67.114666-9.642667 30.677334-9.173333 28.672-17.066667 51.626666-11.648 33.621334-7.210666 20.053333-9.984 26.368-6.101334 15.232c-29.525333 71.253333-90.453333 103.978667-170.112 94.592l-387.114666-28.8a587.690667 587.690667 0 0 0-7.381334-0.341333l-15.36-0.341334H218.026667l-12.501334-0.213333-9.984-0.426667-8.32-0.768-3.712-0.554666-7.125333-1.408-11.52-3.029334c-59.349333-17.621333-90.24-67.925333-90.24-139.605333v-283.52c0-90.538667 54.954667-142.208 148.565333-142.208l75.776-0.042667 5.205334-3.968a293.632 293.632 0 0 0 72.234666-88.32l6.101334-11.946666c6.101333-12.544 11.093333-25.685333 15.829333-41.002667l0.768-2.602667z m88.661333 8.064c-1.834667-0.426667-2.645333 0.170667-3.541333 2.773333l-3.882667 14.933334-10.666666 38.442666-2.56 8.533334a366.933333 366.933333 0 0 1-20.565334 53.162666 387.754667 387.754667 0 0 1-72.618666 102.442667 333.141333 333.141333 0 0 1-49.28 42.026667l5.504-3.925334v417.408l336.682666 25.344c41.898667 4.906667 65.621333-6.101333 80.213334-36.096l2.858666-6.229333 5.76-14.378667 9.514667-25.173333 6.912-19.285333 11.221333-32.469334 8.064-24.064 17.365334-53.76 19.2-61.354666 15.445333-50.858667c18.986667-76.074667 7.808-94.592-38.357333-94.592h-217.685334a53.632 53.632 0 0 1-50.730666-71.125333l2.176-6.4 3.328-10.922667c10.282667-35.754667 13.226667-59.136 13.226666-108.629333 0-48.426667-26.88-72.96-57.045333-82.261334l-3.712-1.152z m-242.944 270.122667h-34.389333c-47.616 0-63.232 14.72-63.232 56.917333v283.52c0 38.016 9.941333 53.333333 33.792 59.008l1.493333 0.341333 3.754667 0.554667 5.12 0.426667 11.562667 0.256h28.586666l13.312 0.085333v-401.066667z" p-id="5283"></path>
                                </svg>
                                <span class="stat-value">${formatNumber(diggCount)}</span>
                                <span class="stat-label">点赞</span>
                            </div>
                            <div class="stat-item">
                                <svg t="1758970888289" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6367" width="16" height="16">
                                    <path d="M878.3 98.2H145.7c-44.7 0-81 36.3-81 81V714c0 44.7 36.3 81 81 81h192.8l149.2 121.8c7.4 6 16.3 9 25.3 9 8.9 0 17.9-3 25.2-9l150-121.8h190c44.7 0 81-36.3 81-81V179.2c0.1-44.7-36.3-81-80.9-81z m1 615.8c0 0.5-0.5 1-1 1H674.1c-9.2 0-18.1 3.2-25.2 9L513.1 834.2 378.1 724c-7.1-5.8-16.1-9-25.3-9H145.7c-0.5 0-1-0.5-1-1V179.2c0-0.5 0.5-1 1-1h732.5c0.5 0 1 0.5 1 1V714z" p-id="6368"></path>
                                    <path d="M322.1 447.6m-50 0a50 50 0 1 0 100 0 50 50 0 1 0-100 0Z" p-id="6369"></path>
                                    <path d="M513.1 447.6m-50 0a50 50 0 1 0 100 0 50 50 0 1 0-100 0Z" p-id="6370"></path>
                                    <path d="M704.3 447.6m-50 0a50 50 0 1 0 100 0 50 50 0 1 0-100 0Z" p-id="6371"></path>
                                </svg>
                                <span class="stat-value">${formatNumber(commentCount)}</span>
                                <span class="stat-label">评论</span>
                            </div>
                            <div class="stat-item">
                                <svg t="1758970931347" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7513" width="16" height="16">
                                    <path d="M335.008 916.629333c-35.914667 22.314667-82.88 10.773333-104.693333-25.557333a77.333333 77.333333 0 0 1-8.96-57.429333l46.485333-198.24a13.141333 13.141333 0 0 0-4.021333-12.864l-152.16-132.586667c-31.605333-27.52-35.253333-75.648-8.234667-107.733333a75.68 75.68 0 0 1 51.733333-26.752L354.848 339.2c4.352-0.362667 8.245333-3.232 10.026667-7.594667l76.938666-188.170666c16.032-39.2 60.618667-57.92 99.52-41.461334a76.309333 76.309333 0 0 1 40.832 41.461334l76.938667 188.16c1.781333 4.373333 5.674667 7.253333 10.026667 7.605333l199.712 16.277333c41.877333 3.413333 72.885333 40.458667 69.568 82.517334a76.938667 76.938667 0 0 1-26.08 51.978666l-152.16 132.586667c-3.541333 3.082667-5.141333 8.074667-4.021334 12.853333l46.485334 198.24c9.621333 41.013333-15.36 82.336-56.138667 92.224a75.285333 75.285333 0 0 1-57.525333-9.237333l-170.976-106.24a11.296 11.296 0 0 0-12.010667 0l-170.986667 106.24zM551.786667 756.032l170.976 106.24c2.624 1.621333 5.717333 2.122667 8.650666 1.408 6.410667-1.557333 10.56-8.426667 8.928-15.424l-46.485333-198.24a77.141333 77.141333 0 0 1 24.277333-75.733333L870.293333 441.706667c2.485333-2.165333 4.053333-5.312 4.330667-8.746667 0.565333-7.136-4.490667-13.173333-10.976-13.696l-199.712-16.288a75.989333 75.989333 0 0 1-64.064-47.168l-76.938667-188.16a12.309333 12.309333 0 0 0-6.538666-6.741333c-5.898667-2.496-12.725333 0.373333-15.328 6.741333l-76.949334 188.16a75.989333 75.989333 0 0 1-64.064 47.168l-199.701333 16.288a11.68 11.68 0 0 0-7.978667 4.181333 13.226667 13.226667 0 0 0 1.333334 18.261334l152.16 132.586666a77.141333 77.141333 0 0 1 24.277333 75.733334l-46.485333 198.229333a13.333333 13.333333 0 0 0 1.514666 9.877333c3.488 5.792 10.581333 7.530667 16.064 4.128l170.986667-106.229333a75.296 75.296 0 0 1 79.562667 0z" p-id="7514"></path>
                                </svg>
                                <span class="stat-value">${formatNumber(collectCount)}</span>
                                <span class="stat-label">收藏</span>
                            </div>
                            <div class="stat-item">
                                <svg t="1758970974923" class="icon" viewBox="0 0 1236 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8506" width="16" height="16">
                                    <path d="M741.743 1018.343c-28.287 0-50.917-11.315-73.547-28.288-22.63-22.63-39.602-50.917-39.602-84.862V792.044c-124.464 0-328.133 33.945-435.624 181.039-16.973 28.287-56.575 45.26-90.52 50.917H85.478C28.903 1012.685-5.042 961.768 0.616 905.193c28.287-243.27 113.15-418.652 260.243-537.458 107.492-84.862 231.956-130.122 367.735-141.437V118.807c0-50.917 22.63-96.177 67.89-113.15C736.086-5.657 781.345 0 815.29 33.945l362.077 367.735c28.288 22.63 45.26 56.574 50.918 96.176 5.657 39.603-5.658 79.205-33.945 107.492-5.658 5.658-11.315 16.972-22.63 22.63l-350.762 356.42c-22.63 22.63-50.918 33.945-79.205 33.945z m-90.52-339.448h90.52v226.298l356.42-367.734 5.658-5.658c5.657-5.657 5.657-16.972 5.657-22.63 0-11.315-5.657-16.972-11.315-22.63l-5.657-5.657-356.42-362.077V333.79l-79.205 5.658c-118.806 0-231.956 39.602-328.132 113.149-113.15 90.519-186.696 237.613-209.326 429.967 141.436-175.382 390.364-203.669 531.8-203.669z" p-id="8507"></path>
                                </svg>
                                <span class="stat-value">${formatNumber(shareCount)}</span>
                                <span class="stat-label">分享</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 视频标题 -->
                <div class="video-title">
                    <div class="title-label">
                        <svg class="title-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm1 15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12z"/>
                            <path d="M8 7h8v2H8zm0 4h8v2H8zm0 4h5v2H8z"/>
                        </svg>
                        <span>视频标题</span>
                    </div>
                    <p>${videoTitle}</p>
                </div>
                
                <!-- 分辨率选项 -->
                <div class="resolution-options">
                    <!-- 分辨率选项将由JS动态填充 -->
                </div>
                

            </div>
        </div>
    `;
    
    // 生成下载选项
    const downloadOptionsHtml = generateDownloadOptions(videoDetail);
    
    // 将下载选项添加到分辨率选项区域
    const resolutionOptions = resultContainer.querySelector('.resolution-options');
    if (resolutionOptions && downloadOptionsHtml) {
        resolutionOptions.innerHTML = downloadOptionsHtml;
    }
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
                            resolution: `${width}x${height}`, // 添加resolution属性
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
                        resolution: `${source.width || (videoDetail.width || (videoDetail.video && videoDetail.video.width))}x${source.height || (videoDetail.height || (videoDetail.video && videoDetail.video.height))}`, // 添加resolution属性
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
    
    const downloadLinks = downloadOptions.map((option, index) => {
        const sizeText = formatFileSize(option.size);
        // 构建更完整的显示文本，包含分辨率、帧率等信息
        let displayText = '';
        if (option.quality) {
            displayText += option.quality;
        }
        
        // 添加分辨率信息
        if (option.height && option.width) {
            if (displayText) displayText += ' ';
            displayText += `(${option.width}x${option.height})`;
        }
        
        // 添加帧率信息
        if (option.frameRate) {
            displayText += ` ${option.frameRate}FPS`;
        }
        
        // 如果以上信息都没有，则显示默认分辨率
        if (!displayText && option.resolution) {
            displayText = option.resolution;
        }
        
        // 如果仍然没有信息，则显示基本标签
        if (!displayText) {
            displayText = '视频下载';
        }
        
        const filename = generateFilename(videoDetail, option, option.fps || option.frameRate || videoFPS);
        
        return `
            <a href="javascript:void(0)" class="download-link" 
               data-url="${option.url}" 
               data-filename="${filename}" 
               onclick="handleDownload(this, event)">
                ${index + 1}. ${displayText} (${sizeText})
            </a>
        `;
    });
    
    optionsHtml += downloadLinks.join('');
    optionsHtml += '</div>';
    return optionsHtml;
}