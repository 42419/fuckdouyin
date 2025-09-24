// 纯前端重定向解决方案 - 备用方案
// 当Cloudflare Functions不可用时使用

/**
 * 纯前端短链接重定向处理
 * 使用多种方法尝试获取重定向URL
 */
class FrontendRedirectResolver {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * 主要重定向解析方法
   * @param {string} shortUrl - 短链接
   * @returns {Promise<{success: boolean, url: string, method: string}>}
   */
  async resolveRedirect(shortUrl) {
    console.log('开始纯前端重定向解析:', shortUrl);

    // 方法1: 尝试使用fetch with redirect: 'manual'
    try {
      const response = await fetch(shortUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': this.userAgent
        }
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          console.log('方法1成功: HEAD请求获取Location头');
          return {
            success: true,
            url: this.normalizeUrl(location, shortUrl),
            method: 'head_location'
          };
        }
      }
    } catch (error) {
      console.log('方法1失败:', error.message);
    }

    // 方法2: 尝试使用fetch with redirect: 'manual' (GET)
    try {
      const response = await fetch(shortUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': '*/*'
        }
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          console.log('方法2成功: GET请求获取Location头');
          return {
            success: true,
            url: this.normalizeUrl(location, shortUrl),
            method: 'get_location'
          };
        }
      }
    } catch (error) {
      console.log('方法2失败:', error.message);
    }

    // 方法3: 尝试跟随重定向
    try {
      const response = await fetch(shortUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': '*/*'
        }
      });

      if (response.url && response.url !== shortUrl) {
        console.log('方法3成功: 跟随重定向');
        return {
          success: true,
          url: response.url,
          method: 'follow_redirect'
        };
      }
    } catch (error) {
      console.log('方法3失败:', error.message);
    }

    // 方法4: 对于抖音短链接，尝试模式匹配
    if (shortUrl.includes('v.douyin.com')) {
      const result = await this.tryDouyinPatternMatching(shortUrl);
      if (result.success) {
        return result;
      }
    }

    // 方法5: 尝试第三方服务（如果CORS允许）
    try {
      const result = await this.tryThirdPartyServices(shortUrl);
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.log('第三方服务失败:', error.message);
    }

    console.log('所有方法都失败');
    return {
      success: false,
      url: shortUrl,
      method: 'all_failed'
    };
  }

  /**
   * 尝试抖音短链接的模式匹配
   */
  async tryDouyinPatternMatching(shortUrl) {
    const shortIdMatch = shortUrl.match(/v\.douyin\.com\/([a-zA-Z0-9_-]+)/);
    if (!shortIdMatch) {
      return { success: false };
    }

    const shortId = shortIdMatch[1];
    const possibleUrls = [
      `https://www.douyin.com/video/${shortId}`,
      `https://www.douyin.com/aweme/v1/play/?video_id=${shortId}`,
      `https://www.douyin.com/share/video/${shortId}`
    ];

    for (const testUrl of possibleUrls) {
      try {
        const response = await fetch(testUrl, {
          method: 'HEAD',
          redirect: 'manual',
          headers: {
            'User-Agent': this.userAgent
          }
        });

        if (response.status === 200 || response.status === 302) {
          console.log('抖音模式匹配成功:', testUrl);
          return {
            success: true,
            url: testUrl,
            method: 'douyin_pattern'
          };
        }
      } catch (error) {
        continue;
      }
    }

    return { success: false };
  }

  /**
   * 尝试第三方服务
   */
  async tryThirdPartyServices(shortUrl) {
    const services = [
      {
        name: 'unshorten.me',
        url: `https://unshorten.me/api/v2/unshorten?url=${encodeURIComponent(shortUrl)}`,
        parser: (data) => data.long_url || data.url
      },
      {
        name: 'unshorten.it',
        url: `https://api.unshorten.it/unshorten?url=${encodeURIComponent(shortUrl)}`,
        parser: (data) => data.expanded_url || data.url
      }
    ];

    for (const service of services) {
      try {
        const response = await fetch(service.url, {
          method: 'GET',
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = { url: text };
          }

          const expandedUrl = service.parser(data);
          if (expandedUrl && expandedUrl !== shortUrl) {
            console.log('第三方服务成功:', service.name);
            return {
              success: true,
              url: expandedUrl,
              method: `third_party_${service.name}`
            };
          }
        }
      } catch (error) {
        continue;
      }
    }

    return { success: false };
  }

  /**
   * 规范化URL，处理相对路径
   */
  normalizeUrl(url, baseUrl) {
    try {
      return new URL(url, baseUrl).toString();
    } catch {
      return url;
    }
  }
}

// 创建全局实例
window.frontendRedirectResolver = new FrontendRedirectResolver();

// 导出给其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrontendRedirectResolver;
}
