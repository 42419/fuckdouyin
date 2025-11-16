// ==================== 版本更新检测模块 ====================

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
                    const li = createChangelogItem(item);
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
                const li = createChangelogItem(item);
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

// 创建更新日志项
function createChangelogItem(item) {
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
    
    return li;
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
