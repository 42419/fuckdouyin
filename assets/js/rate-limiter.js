// ==================== 频率限制模块 ====================
// 频率限制对象
const rateLimiter = {
    maxRequests: 3,           // 每分钟最多3次请求
    windowMs: 60 * 1000,      // 时间窗口：1分钟（毫秒）
    requests: [],             // 请求时间戳数组

    // 检查是否允许请求
    canMakeRequest: function() {
        const now = Date.now();
        // 清除过期时间戳（超过1分钟的）
        this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);

        // 检查当前窗口内的请求数量
        if (this.requests.length >= this.maxRequests) {
            const nextAllowedTime = this.requests[0] + this.windowMs;
            const remainingTime = Math.ceil((nextAllowedTime - now) / 1000);
            return {
                allowed: false,
                remainingTime: remainingTime
            };
        }

        return { allowed: true };
    },

    // 记录请求
    recordRequest: function() {
        const now = Date.now();
        this.requests.push(now);
        // 保存到localStorage以持久化
        localStorage.setItem('rateLimiterRequests', JSON.stringify(this.requests));
    },

    // 从localStorage恢复请求记录
    restoreRequests: function() {
        const stored = localStorage.getItem('rateLimiterRequests');
        if (stored) {
            try {
                this.requests = JSON.parse(stored).filter(timestamp =>
                    Date.now() - timestamp < this.windowMs
                );
            } catch (e) {
                this.requests = [];
            }
        }
    }
};

// 带动画的隐藏提示（用于频率限制提示的渐进消失）
function hideRateLimitHint(hintElement) {
    if (!hintElement || !hintElement.parentNode) return;

    // 添加渐进淡出效果
    hintElement.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    hintElement.style.opacity = '0';
    hintElement.style.transform = 'translateX(-50%) translateY(-120%)';

    // 动画完成后移除元素
    setTimeout(() => {
        if (hintElement.parentNode) {
            hintElement.parentNode.removeChild(hintElement);
        }
    }, 500);
}

// 显示频率限制提示（采用和抖音浏览器提示相同的样式，带进度条自动关闭）
function showRateLimitHint(timeMessage) {
    // 创建提示元素
    const hintElement = document.createElement('div');
    hintElement.className = 'douyin-browser-hint rate-limit-hint';

    hintElement.innerHTML = `
        <div class="progress-bar"></div>
        <div class="hint-content">
            <div class="hint-icon">⏱️</div>
            <div class="hint-text">
                <strong>解析频率限制</strong>
                <p>每分钟只能解析3次，请等待${timeMessage}后再试</p>
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
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        border-radius: 12px;
        padding: 4px 20px 16px 20px;
        box-shadow: 0 8px 32px rgba(255, 107, 53, 0.3);
        z-index: 9999;
        max-width: 450px;
        width: 90%;
        opacity: 0;
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
    `;

    // 进度条样式
    const progressBar = hintElement.querySelector('.progress-bar');
    progressBar.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 4px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.8));
        border-radius: 2px 0 0 0;
    `;

    const hintContent = hintElement.querySelector('.hint-content');
    hintContent.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: space-between;
        padding-top: 16px;
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
    let autoCloseTimer;
    hintClose.addEventListener('click', function() {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        hideRateLimitHint(hintElement);
    });

    // 添加到页面
    document.body.appendChild(hintElement);

    // 延迟显示动画，确保元素已添加到DOM
    setTimeout(() => {
        hintElement.classList.add('show');
        hintElement.style.transform = 'translateX(-50%) translateY(0)';
        hintElement.style.opacity = '1';

        // 开始进度条动画
        progressBar.style.transition = 'width 3s linear';
        progressBar.style.width = '100%';
    }, 50);

    // 自动关闭计时器
    autoCloseTimer = setTimeout(() => {
        hideRateLimitHint(hintElement);
    }, 3000); // 3秒后自动关闭

    // ESC键关闭
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            if (autoCloseTimer) clearTimeout(autoCloseTimer);
            hideRateLimitHint(hintElement);
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);

    // 点击任何位置关闭
    hintElement.addEventListener('click', function(e) {
        if (e.target === this || e.target === hintClose) {
            if (autoCloseTimer) clearTimeout(autoCloseTimer);
            hideRateLimitHint(hintElement);
        }
    });

    // 添加CSS动画样式
    const style = document.createElement('style');
    style.textContent = `
        .rate-limit-hint .progress-bar {
            transition: width 3s linear;
        }
    `;
    document.head.appendChild(style);
}
