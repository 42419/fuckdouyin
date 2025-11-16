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
