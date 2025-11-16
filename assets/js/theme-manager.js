// ==================== 主题管理模块 ====================
// 负责主题切换、自动/手动模式管理

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
    let isTouchEnabled = true;
    
    // 检查是否支持触摸事件
    const isTouchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchSupported) {
        hintElement.addEventListener('touchstart', function(e) {
            if (!isTouchEnabled) return;
            
            e.stopPropagation(); // 阻止事件冒泡
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            hintElement.style.transition = 'none'; // 禁用过渡效果，实现流畅跟随
            
            // 添加触摸反馈样式
            hintElement.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        }, { passive: false });
        
        hintElement.addEventListener('touchmove', function(e) {
            if (!isTouchEnabled || !touchStartY) return;
            
            e.stopPropagation(); // 阻止事件冒泡
            
            // 只有在实际滑动时才阻止默认行为
            if (Math.abs(e.touches[0].clientY - touchStartY) > 5) {
                e.preventDefault(); // 阻止默认滚动行为
            }
            
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY; // 上滑为正值
            
            if (deltaY > 0) { // 只处理上滑
                const translateY = Math.min(deltaY, 100); // 限制最大滑动距离
                hintElement.style.transform = `translateY(-${translateY}px)`;
                hintElement.style.opacity = Math.max(0.3, 1 - translateY / 100); // 随滑动淡出
            }
        }, { passive: false });
        
        hintElement.addEventListener('touchend', function(e) {
            if (!isTouchEnabled || !touchStartY) return;
            
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
                
                // 禁用后续触摸事件
                isTouchEnabled = false;
                
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
                
                // 恢复阴影样式
                hintElement.style.boxShadow = 'var(--shadow)';
            }
            
            // 重置触摸状态
            touchStartY = 0;
            touchStartTime = 0;
        }, { passive: false });
        
        // 添加触摸取消事件
        hintElement.addEventListener('touchcancel', function(e) {
            if (!isTouchEnabled || !touchStartY) return;
            
            e.stopPropagation(); // 阻止事件冒泡
            
            // 触摸取消时恢复原位置
            hintElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            hintElement.style.transform = 'translateY(0)';
            hintElement.style.opacity = '1';
            hintElement.style.boxShadow = 'var(--shadow)';
            
            // 重置触摸状态
            touchStartY = 0;
            touchStartTime = 0;
        }, { passive: false });
    }
    
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
