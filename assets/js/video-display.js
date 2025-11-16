// ==================== 视频数据显示模块 ====================

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
                            </div>
                            <div class="stat-item">
                                <svg t="1758970888289" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6367" width="16" height="16">
                                    <path d="M878.3 98.2H145.7c-44.7 0-81 36.3-81 81V714c0 44.7 36.3 81 81 81h192.8l149.2 121.8c7.4 6 16.3 9 25.3 9 8.9 0 17.9-3 25.2-9l150-121.8h190c44.7 0 81-36.3 81-81V179.2c0.1-44.7-36.3-81-80.9-81z m1 615.8c0 0.5-0.5 1-1 1H674.1c-9.2 0-18.1 3.2-25.2 9L513.1 834.2 378.1 724c-7.1-5.8-16.1-9-25.3-9H145.7c-0.5 0-1-0.5-1-1V179.2c0-0.5 0.5-1 1-1h732.5c0.5 0 1 0.5 1 1V714z" p-id="6368"></path>
                                    <path d="M322.1 447.6m-50 0a50 50 0 1 0 100 0 50 50 0 1 0-100 0Z" p-id="6369"></path>
                                    <path d="M513.1 447.6m-50 0a50 50 0 1 0 100 0 50 50 0 1 0-100 0Z" p-id="6370"></path>
                                    <path d="M704.3 447.6m-50 0a50 50 0 1 0 100 0 50 50 0 1 0-100 0Z" p-id="6371"></path>
                                </svg>
                                <span class="stat-value">${formatNumber(commentCount)}</span>
                            </div>
                            <div class="stat-item">
                                <svg t="1758970931347" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7513" width="16" height="16">
                                    <path d="M335.008 916.629333c-35.914667 22.314667-82.88 10.773333-104.693333-25.557333a77.333333 77.333333 0 0 1-8.96-57.429333l46.485333-198.24a13.141333 13.141333 0 0 0-4.021333-12.864l-152.16-132.586667c-31.605333-27.52-35.253333-75.648-8.234667-107.733333a75.68 75.68 0 0 1 51.733333-26.752L354.848 339.2c4.352-0.362667 8.245333-3.232 10.026667-7.594667l76.938666-188.170666c16.032-39.2 60.618667-57.92 99.52-41.461334a76.309333 76.309333 0 0 1 40.832 41.461334l76.938667 188.16c1.781333 4.373333 5.674667 7.253333 10.026667 7.605333l199.712 16.277333c41.877333 3.413333 72.885333 40.458667 69.568 82.517334a76.938667 76.938667 0 0 1-26.08 51.978666l-152.16 132.586667c-3.541333 3.082667-5.141333 8.074667-4.021334 12.853333l46.485334 198.24c9.621333 41.013333-15.36 82.336-56.138667 92.224a75.285333 75.285333 0 0 1-57.525333-9.237333l-170.976-106.24a11.296 11.296 0 0 0-12.010667 0l-170.986667 106.24zM551.786667 756.032l170.976 106.24c2.624 1.621333 5.717333 2.122667 8.650666 1.408 6.410667-1.557333 10.56-8.426667 8.928-15.424l-46.485333-198.24a77.141333 77.141333 0 0 1 24.277333-75.733333L870.293333 441.706667c2.485333-2.165333 4.053333-5.312 4.330667-8.746667 0.565333-7.136-4.490667-13.173333-10.976-13.696l-199.712-16.288a75.989333 75.989333 0 0 1-64.064-47.168l-76.938667-188.16a12.309333 12.309333 0 0 0-6.538666-6.741333c-5.898667-2.496-12.725333 0.373333-15.328 6.741333l-76.949334 188.16a75.989333 75.989333 0 0 1-64.064 47.168l-199.701333 16.288a11.68 11.68 0 0 0-7.978667 4.181333 13.226667 13.226667 0 0 0 1.333334 18.261334l152.16 132.586666a77.141333 77.141333 0 0 1 24.277333 75.733334l-46.485333 198.229333a13.333333 13.333333 0 0 0 1.514666 9.877333c3.488 5.792 10.581333 7.530667 16.064 4.128l170.986667-106.229333a75.296 75.296 0 0 1 79.562667 0z" p-id="7514"></path>
                                </svg>
                                <span class="stat-value">${formatNumber(collectCount)}</span>
                            </div>
                            <div class="stat-item">
                                <svg t="1758970974923" class="icon" viewBox="0 0 1236 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8506" width="16" height="16">
                                    <path d="M741.743 1018.343c-28.287 0-50.917-11.315-73.547-28.288-22.63-22.63-39.602-50.917-39.602-84.862V792.044c-124.464 0-328.133 33.945-435.624 181.039-16.973 28.287-56.575 45.26-90.52 50.917H85.478C28.903 1012.685-5.042 961.768 0.616 905.193c28.287-243.27 113.15-418.652 260.243-537.458 107.492-84.862 231.956-130.122 367.735-141.437V118.807c0-50.917 22.63-96.177 67.89-113.15C736.086-5.657 781.345 0 815.29 33.945l362.077 367.735c28.288 22.63 45.26 56.574 50.918 96.176 5.657 39.603-5.658 79.205-33.945 107.492-5.658 5.658-11.315 16.972-22.63 22.63l-350.762 356.42c-22.63 22.63-50.918 33.945-79.205 33.945z m-90.52-339.448h90.52v226.298l356.42-367.734 5.658-5.658c5.657-5.657 5.657-16.972 5.657-22.63 0-11.315-5.657-16.972-11.315-22.63l-5.657-5.657-356.42-362.077V333.79l-79.205 5.658c-118.806 0-231.956 39.602-328.132 113.149-113.15 90.519-186.696 237.613-209.326 429.967 141.436-175.382 390.364-203.669 531.8-203.669z" p-id="8507"></path>
                                </svg>
                                <span class="stat-value">${formatNumber(shareCount)}</span>
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
