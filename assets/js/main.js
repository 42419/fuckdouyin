// ==================== 主入口文件 ====================
// 负责页面初始化和事件绑定

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
    // 初始化主题
    initTheme();
    
    // 设置当前页面的激活导航项
    setActiveNavItem();
    
    // 禁用右键菜单
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // 禁用复制快捷键 (Ctrl+C, Cmd+C)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
            e.preventDefault();
        }
    });
    
    // 获取表单元素
    const downloadForm = document.querySelector('.download-form');
    const searchInput = document.getElementById('search');
    
    // 为表单添加提交事件监听器
    if (downloadForm && searchInput) {
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

                // 检查频率限制，在显示加载状态前提前检查
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

                    // 显示频率限制提示（模仿抖音浏览器提示样式）
                    showRateLimitHint(timeMessage);
                    return; // 阻止继续处理
                }

                showLoading(true);

                // 使用新的聚合解析接口 (BFF模式)
                // 直接调用后端 /api/analysis，一次性完成重定向和解析
                const baseUrl = getApiBaseUrl();
                const analysisUrl = `${baseUrl}/api/analysis?url=${encodeURIComponent(shortLink)}`;
                
                fetchVideoData(analysisUrl);
                
                // 记录成功解析 (预先记录，虽然请求还没完成)
                rateLimiter.recordRequest();
                return;
            }
            
            // 检查是否是用户主页链接
            if (awemeId.startsWith('userProfile:')) {
                showLoading(false);
                alert('检测到用户主页链接，但目前仅支持单个视频的下载');
                return;
            }
            
            // 构建API请求URL - 使用fetch_one_video接口
            // 如果是长链接直接提取到了ID，也可以走聚合接口，或者保持原样
            // 为了统一体验和利用后端网络，建议也走聚合接口，或者直接请求第三方
            // 这里保持原样，直接请求第三方，因为已经有ID了
            const apiUrl = `https://dapi.liyunfei.eu.org/api/douyin/web/fetch_one_video?aweme_id=${awemeId}`;
            
            // 显示加载状态
            showLoading(true);
            
            // 发送API请求
            fetchVideoData(apiUrl);
        });
    }
});

// 点击外部关闭菜单
document.addEventListener('click', function(event) {
    const banner = document.getElementById('banner');
    const button = document.querySelector('.menu-toggle');
    if (banner && button) {
        if (!banner.contains(event.target) && event.target !== button && banner.classList.contains('active')) {
            banner.classList.remove('active');
            button.classList.remove('active');
        }
    }
});

// ESC 键关闭菜单（增强无障碍）
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const banner = document.getElementById('banner');
        const button = document.querySelector('.menu-toggle');
        if (banner && button && banner.classList.contains('active')) {
            banner.classList.remove('active');
            button.classList.remove('active');
        }
    }
});

// 处理窗口大小变化时的菜单状态
window.addEventListener('resize', function() {
    const banner = document.getElementById('banner');
    const button = document.querySelector('.menu-toggle');
    
    if (banner && button) {
        // 如果窗口变大到768px以上并且菜单是激活状态，则隐藏菜单
        if (window.innerWidth > 768 && banner.classList.contains('active')) {
            banner.classList.remove('active');
            button.classList.remove('active');
        }
    }
});
