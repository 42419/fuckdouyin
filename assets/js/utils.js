// ==================== 工具函数模块 ====================
// 提供通用的格式化、检测等功能

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

// 获取 API 基础地址
function getApiBaseUrl() {
    const hostname = window.location.hostname;
    
    // 1. 本地开发环境
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8787';
    }
    
    // 2. Netlify 环境 (前后端同源)
    if (hostname.endsWith('.netlify.app')) {
        return ''; // 使用相对路径
    }
    
    // 3. Cloudflare Pages 环境 (需要手动配置 Worker 地址)
    // 如果你有固定的 Worker 地址，可以在这里直接返回
    return 'https://douyin-hono.liyunfei.eu.org';
    
    // 默认尝试相对路径 (适用于前后端同源的情况)
    return '';
}
