// ==================== 下载选项生成模块 ====================
// 根据视频详情数据生成下载链接HTML

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
                            resolution: `${width}x${height}`,
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
        
        // 2. 从其他位置获取视频链接（兼容处理）
        if (options.length === 0) {
            console.log('bit_rates为空，尝试从其他位置获取链接');
            
            // 辅助函数：尝试从特定位置获取链接
            const tryAddLinksFromSource = (source, qualityLabel) => {
                if (!source || !source.url_list || !Array.isArray(source.url_list)) {
                    return false;
                }
                
                let priorityUrl = null;
                if (source.url_list.length > 0) {
                    priorityUrl = convertToDouyinUrl(source.url_list[0], videoId);
                }
                
                if (priorityUrl) {
                    options.push({
                        url: priorityUrl,
                        quality: qualityLabel,
                        resolution: `${source.width || (videoDetail.width || (videoDetail.video && videoDetail.video.width))}x${source.height || (videoDetail.height || (videoDetail.video && videoDetail.video.height))}`,
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
            if (videoDetail.video && videoDetail.video.download_addr) {
                if (tryAddLinksFromSource(videoDetail.video.download_addr, '无水印')) {
                    return options;
                }
            }
            
            if (videoDetail.download_addr) {
                if (tryAddLinksFromSource(videoDetail.download_addr, '无水印')) {
                    return options;
                }
            }
            
            if (videoDetail.video && videoDetail.video.play_addr) {
                if (tryAddLinksFromSource(videoDetail.video.play_addr, '原画')) {
                    return options;
                }
            }
            
            if (videoDetail.play_addr) {
                tryAddLinksFromSource(videoDetail.play_addr, '原画');
            }
        }
        
        // 排序和去重
        options.sort((a, b) => {
            const aLongSide = Math.max(a.height || 0, a.width || 0);
            const bLongSide = Math.max(b.height || 0, b.width || 0);
            if (aLongSide !== bLongSide) {
                return bLongSide - aLongSide;
            }
            return (b.frameRate || 0) - (a.frameRate || 0);
        });
        
        console.log('最终下载选项（已排序）:', options);
        
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
        
        if (metadata.fps) return metadata.fps;
        if (metadata.frame_rate) return metadata.frame_rate;
        if (metadata.video && metadata.video.fps) return metadata.video.fps;
        if (metadata.video && metadata.video.frame_rate) return metadata.video.frame_rate;
        
        if (metadata.duration && metadata.total_frames) {
            return Math.round(metadata.total_frames / (metadata.duration / 1000));
        }
        
        return null;
    }
    
    // 生成安全的文件名
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
        console.error('generateDownloadOptions - 未能找到可用的下载链接:', {
            hasBitRate: !!videoDetail.bit_rate,
            hasPlayAddr: !!(videoDetail.play_addr || (videoDetail.video && videoDetail.video.play_addr)),
            hasDownloadAddr: !!(videoDetail.download_addr || (videoDetail.video && videoDetail.video.download_addr)),
            hasVideoList: !!videoDetail.video_list,
            hasDownloadList: !!videoDetail.download_list
        });
        return '<p class="error-message">未能找到可用的下载链接</p>';
    }
    
    // 排序
    downloadOptions.sort((a, b) => {
        const aLongSide = Math.max(a.height || 0, a.width || 0);
        const bLongSide = Math.max(b.height || 0, b.width || 0);
        if (aLongSide !== bLongSide) {
            return bLongSide - aLongSide;
        }
        return (b.frameRate || 0) - (a.frameRate || 0);
    });
    
    // 生成下载选项HTML
    let optionsHtml = '<div class="download-links">';
    
    const downloadLinks = downloadOptions.map((option, index) => {
        const sizeText = formatFileSize(option.size);
        let displayText = '';
        if (option.quality) {
            displayText += option.quality;
        }
        
        if (option.height && option.width) {
            if (displayText) displayText += ' ';
            displayText += `(${option.width}x${option.height})`;
        }
        
        if (option.frameRate) {
            displayText += ` ${option.frameRate}FPS`;
        }
        
        if (!displayText && option.resolution) {
            displayText = option.resolution;
        }
        
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
