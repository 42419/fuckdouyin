// ==================== 版本更新检测模块 ====================

// 更新检测和提示功能
let currentVersion = '1.0.0'; // 当前版本号（默认占位）

// 预取并强制重新验证所有静态资源，随后刷新页面
async function forceFullRefresh(newVersion) {
    try {
        // 标记进行中的刷新，避免重复触发
        if (window.__forceRefreshing) return;
        window.__forceRefreshing = true;

        // 清理 Cache Storage（与 HTTP 缓存不同，但可删除自定义缓存）
        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            } catch (e) {
                console.log('Cache Storage 清理失败:', e);
            }
        }

        // 收集需要强制刷新的资源（CSS/JS）
        const assetElements = [
            ...document.querySelectorAll('link[rel="stylesheet"]'),
            ...document.querySelectorAll('script[src]')
        ];

        // 使用 fetch cache:'reload' 主动重新验证原始资源 URL（不加参数，确保覆盖后续正常加载）
        const preloadTasks = [];
        assetElements.forEach(el => {
            const originalUrl = el.href || el.src;
            if (!originalUrl) return;
            preloadTasks.push(
                fetch(originalUrl, { cache: 'reload' }).catch(err => {
                    console.log('预取失败:', originalUrl, err);
                })
            );
        });

        // 版本文件强制重新验证
        preloadTasks.push(fetch('/version.json?force=' + Date.now(), { cache: 'reload' }).catch(()=>{}));

        await Promise.all(preloadTasks);
        // 触发真正的页面刷新
        console.log('版本变化，执行强制刷新 ->', newVersion);
        window.location.reload();
    } catch (e) {
        console.log('强制刷新流程异常，直接刷新:', e);
        window.location.reload();
    }
}

// 检查更新
async function checkForUpdates(forceShow = false) {
    try {
        // 获取版本信息，添加时间戳和版本戳避免缓存
        const response = await fetch('/version.json?v=' + Date.now());
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const versionInfo = await response.json();
        
        // 检查本地存储的版本号
        const lastVersion = localStorage.getItem('app_version');
        const lastUpdateTime = localStorage.getItem('last_update_check');
        // 如果已存在旧版本且与新版本不同 => 显示更新弹窗，关闭后刷新
        if (lastVersion && lastVersion !== versionInfo.version) {
            // 显示更新弹窗
            showUpdateModal(versionInfo);
            // 设置标志，表示需要刷新
            localStorage.setItem('pending_refresh', 'true');
            // 更新本地版本号
            localStorage.setItem('app_version', versionInfo.version);
            localStorage.setItem('last_update_check', Date.now().toString());
            return; // 等待用户关闭弹窗后刷新
        }
        
        // 如果是第一次访问或版本不同，显示更新提示
        if (!lastVersion || forceShow) {
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
        // 清空并以 Markdown 渲染
        changelogList.innerHTML = '';

        // 生成所有版本的渲染数据（无 history 时用当前）
        const versions = (versionInfo.history && versionInfo.history.length > 0)
            ? [...versionInfo.history].sort((a, b) => compareVersions(b.version, a.version))
            : [versionInfo];

        versions.forEach((v, idx) => {
            const versionContainer = document.createElement('div');
            versionContainer.className = idx === 0 ? 'version-container latest-version' : 'version-container history-version';

            const buildDate = v.build_date ? new Date(v.build_date).toISOString().split('T')[0] : '';
                const headingHtml = `<div class="version-title"><strong>v${v.version}${buildDate ? ` (${buildDate})` : ''}</strong></div>`;
            versionContainer.insertAdjacentHTML('beforeend', headingHtml);

            // 将旧格式 '=== 标题 ===' 转换为 markdown '### 标题'
            const normalizedLines = v.changelog.map(line => {
                const trimmed = line.trim();
                const match = trimmed.match(/^===\s*(.+?)\s*===$/);
                if (match) return '### ' + match[1];
                return line;
            });

            const markdownText = normalizedLines.join('\n');
            const html = parseMarkdown(markdownText);

            const bodyWrapper = document.createElement('div');
            bodyWrapper.className = 'markdown-body';
            bodyWrapper.innerHTML = html;
            versionContainer.appendChild(bodyWrapper);
            changelogList.appendChild(versionContainer);
        });
        
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

// 轻量 Markdown 解析（标题/列表/粗体/斜体/内联代码/分段）
function parseMarkdown(md) {
    // 安全：先转义，再恢复我们生成的标签
    const escapeHtml = (str) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 预处理：统一换行，去除 Windows 回车
    md = md.replace(/\r/g, '').trim();

    // 处理代码块 ```
    let inCodeBlock = false;
    let codeBlockLang = '';
    const lines = md.split(/\n/);
    const out = [];
    let listBuffer = [];
    let blockquoteBuffer = [];

    const flushList = () => {
        if (listBuffer.length) {
            out.push('<ul>' + listBuffer.map(item => `<li>${item}</li>`).join('') + '</ul>');
            listBuffer = [];
        }
    };

    lines.forEach(rawLine => {
        let line = rawLine;
        const trimmed = line.trim();
        // 代码块开始/结束 (支持语言) ```lang
        const codeFenceMatch = trimmed.match(/^```(.*)$/);
        if (codeFenceMatch) {
            if (inCodeBlock) {
                // 关闭代码块：输出累积内容并包裹行号
                const codeContent = blockquoteBuffer.join('\n'); // 复用 buffer 临时存储代码行
                blockquoteBuffer = [];
                const htmlLines = codeContent.split('\n').map(l => `<span class=\"code-line\">${escapeHtml(l)}</span>`).join('');
                out.push(`<pre class=\"code-block language-${codeBlockLang}\"><code>${htmlLines}</code></pre>`);
                inCodeBlock = false;
                codeBlockLang = '';
            } else {
                flushList();
                flushBlockquote();
                inCodeBlock = true;
                codeBlockLang = (codeFenceMatch[1] || '').trim().toLowerCase();
                blockquoteBuffer = []; // 用作代码行缓存
            }
            return;
        }
        if (inCodeBlock) {
            blockquoteBuffer.push(line);
            return;
        }

        // 标题 (#, ##, ### ...)
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            flushList();
            flushBlockquote();
            const level = headingMatch[1].length;
            const content = inlineMarkdown(headingMatch[2]);
            out.push(`<h${level}>${content}</h${level}>`);
            return;
        }

        // 列表项 (- 或 * 或 • )
        const listMatch = line.match(/^\s*([-*•])\s+(.*)$/);
        if (listMatch) {
            flushBlockquote();
            listBuffer.push(inlineMarkdown(listMatch[2]));
            return;
        }

        // Blockquote > 内容 (允许嵌套简单处理)
        const bqMatch = line.match(/^>\s?(.*)$/);
        if (bqMatch) {
            flushList();
            blockquoteBuffer.push(inlineMarkdown(bqMatch[1]));
            return;
        }

        // 水平线
        if (/^---+$/.test(line.trim())) {
            flushList();
            flushBlockquote();
            out.push('<hr />');
            return;
        }

        // 空行 => 段落分隔
        if (line.trim() === '') {
            flushList();
            flushBlockquote();
            out.push('');
            return;
        }

        flushList();
        flushBlockquote();
        out.push('<p>' + inlineMarkdown(line) + '</p>');
    });
    flushList();
    flushBlockquote();

    return out.join('\n')
        // 恢复在 inlineMarkdown 中生成的标签允许的范围（其本身已经构造安全标签）
        .replace(/&lt;(strong|em|code|br)>&lt;\/\1>/g, '<$1></$1>');
}

function inlineMarkdown(text) {
    // 转义基础 HTML
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    // 粗体 **text**
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // 斜体 *text* (避免与粗体冲突，粗体已处理)
    escaped = escaped.replace(/(^|\s)\*(?!\s)([^*]+?)\*(?=\s|$)/g, '$1<em>$2</em>');
    // 行内代码 `code`
    escaped = escaped.replace(/`([^`]+?)`/g, (m, c) => `<code>${c.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code>`);
    // 链接 [text](url)
    escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) => {
        const safeUrl = sanitizeUrl(url);
        if (!safeUrl) return txt; // 不安全则返回纯文本
        return `<a href=\"${safeUrl}\" target=\"_blank\" rel=\"noopener noreferrer\">${txt}</a>`;
    });
    // 自动链接 http/https
    escaped = escaped.replace(/(https?:\/\/[^\s)]+)(?![^<]*>)/g, (m) => {
        const safeUrl = sanitizeUrl(m);
        if (!safeUrl) return m;
        return `<a href=\"${safeUrl}\" target=\"_blank\" rel=\"noopener noreferrer\">${m}</a>`;
    });
    return escaped;
}

function sanitizeUrl(url) {
    try {
        const trimmed = url.trim();
        if (/^(javascript:)/i.test(trimmed)) return null;
        if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
        return null; // 只允许 http/https/mailto
    } catch { return null; }
}

function flushBlockquote() {
    if (typeof blockquoteBuffer !== 'undefined' && blockquoteBuffer.length) {
        const inner = blockquoteBuffer.map(l => `<p>${l}</p>`).join('');
        out.push(`<blockquote>${inner}</blockquote>`);
        blockquoteBuffer = [];
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
        // 统一使用关闭动画（桌面与移动一致）
        modal.classList.add('closing');
        modalContent.classList.add('closing');
        
        const duration = 380; // 与 CSS 中 modalFadeOut / contentFadeOut 时长同步
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
            modalContent.classList.remove('closing');
            
            // 检查是否需要刷新（版本更新后）
            if (localStorage.getItem('pending_refresh') === 'true') {
                localStorage.removeItem('pending_refresh');
                // 延迟刷新以确保动画完成
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }
        }, duration);
    }
}
