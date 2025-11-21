/**
 * 历史记录管理模块
 * 负责保存、读取和展示用户的下载历史
 */

const HISTORY_KEY = 'douyin_download_history';
const MAX_HISTORY_ITEMS = 10;

// 保存历史记录
function addToHistory(videoData) {
    if (!videoData || !videoData.aweme_id) return;

    const historyItem = {
        id: videoData.aweme_id,
        title: videoData.desc || '无标题',
        author: videoData.author ? videoData.author.nickname : '未知作者',
        cover: videoData.video && videoData.video.cover ? videoData.video.cover.url_list[0] : '',
        timestamp: new Date().getTime(),
        link: `https://www.douyin.com/video/${videoData.aweme_id}`
    };

    let history = getHistory();
    
    // 移除重复项
    history = history.filter(item => item.id !== historyItem.id);
    
    // 添加新项到开头
    history.unshift(historyItem);
    
    // 限制数量
    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    
    // 如果当前在显示历史记录，刷新显示
    renderHistory();
}

// 获取历史记录
function getHistory() {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
}

// 清除历史记录
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
    }
}

// 渲染历史记录区域
function renderHistory() {
    const historyContainer = document.getElementById('history-list');
    const historySection = document.getElementById('history-section');
    
    if (!historyContainer || !historySection) return;
    
    const history = getHistory();
    
    if (history.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    historyContainer.innerHTML = '';
    
    history.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        const el = document.createElement('div');
        el.className = 'history-item';
        el.innerHTML = `
            <div class="history-cover">
                <img src="${item.cover}" alt="封面" onerror="this.src='assets/images/default-cover.png'">
            </div>
            <div class="history-info">
                <div class="history-title">${item.title}</div>
                <div class="history-meta">
                    <span>@${item.author}</span>
                    <span>${date}</span>
                </div>
            </div>
            <div class="history-actions">
                <button onclick="fillInput('${item.link}')" class="history-btn">再次解析</button>
            </div>
        `;
        historyContainer.appendChild(el);
    });
}

// 辅助函数：填充输入框并滚动到顶部
function fillInput(url) {
    const input = document.getElementById('search');
    if (input) {
        input.value = url;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // 可选：自动触发点击解析按钮
        // document.querySelector('.download-btn').click();
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    renderHistory();
});
