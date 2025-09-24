// 智能重定向处理系统 - 用户友好版
class SmartRedirectHandler {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * 处理短链接重定向
   * @param {string} shortLink - 短链接
   * @param {function} callback - 回调函数
   */
  async handleRedirect(shortLink, callback) {
    if (this.isProcessing) {
      console.log('正在处理中，请稍候...');
      return;
    }

    this.isProcessing = true;
    console.log('开始智能重定向处理:', shortLink);

    try {
      // 方法1: 尝试服务器API
      const serverResult = await this.tryServerAPI(shortLink);
      if (serverResult.success) {
        console.log('服务器API成功:', serverResult.url);
        callback(serverResult.url);
        return;
      }

      // 方法2: 检查是否是抖音短链接
      if (shortLink.includes('v.douyin.com')) {
        console.log('检测到抖音短链接，显示智能引导');
        this.showDouyinGuidance(shortLink, callback);
        return;
      }

      // 方法3: 显示通用引导
      this.showGenericGuidance(shortLink, callback);

    } catch (error) {
      console.error('重定向处理错误:', error);
      this.showGenericGuidance(shortLink, callback);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 尝试服务器API
   */
  async tryServerAPI(shortLink) {
    try {
      const response = await fetch(`/api/redirect?url=${encodeURIComponent(shortLink)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.log('服务器API不可用:', error.message);
    }

    return { success: false };
  }

  /**
   * 显示抖音短链接引导
   */
  showDouyinGuidance(shortLink, callback) {
    const dialog = this.createDialog({
      title: '🎯 抖音短链接解析',
      content: `
        <div style="text-align: center; padding: 20px;">
          <div style="background: #f0f8ff; border: 2px solid #007bff; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">📱 获取完整链接</h3>
            <p style="color: #666; line-height: 1.6;">
              由于抖音的安全限制，需要手动获取完整链接。<br>
              请按照以下步骤操作：
            </p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <h4 style="color: #856404; margin-top: 0;">📋 操作步骤：</h4>
            <ol style="text-align: left; color: #856404; line-height: 1.8;">
              <li><strong>点击下方按钮</strong>打开抖音短链接</li>
              <li><strong>等待页面加载</strong>（可能需要几秒钟）</li>
              <li><strong>复制地址栏</strong>中的完整URL</li>
              <li><strong>粘贴到下方</strong>输入框中</li>
            </ol>
          </div>

          <div style="margin: 20px 0;">
            <a href="${shortLink}" target="_blank" 
               style="display: inline-block; background: linear-gradient(45deg, #ff6b6b, #ff8e8e); 
                      color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                      font-weight: bold; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                      transition: all 0.3s ease;">
              🔗 打开抖音短链接
            </a>
          </div>

          <div style="margin: 20px 0;">
            <input type="text" id="douyinUrlInput" 
                   placeholder="请粘贴完整URL到这里..." 
                   style="width: 100%; padding: 12px; border: 2px solid #ddd; 
                          border-radius: 8px; font-size: 14px; box-sizing: border-box;">
          </div>

          <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <h4 style="color: #2e7d32; margin-top: 0;">💡 提示：</h4>
            <p style="color: #2e7d32; margin: 0; font-size: 13px;">
              完整URL通常包含 <code>video/</code> 或 <code>aweme/</code> 等关键词
            </p>
          </div>
        </div>
      `,
      buttons: [
        {
          text: '取消',
          style: 'background: #6c757d; color: white;',
          action: () => {
            this.closeDialog();
            callback(null);
          }
        },
        {
          text: '确认解析',
          style: 'background: #28a745; color: white;',
          action: () => {
            const url = document.getElementById('douyinUrlInput').value.trim();
            if (url) {
              this.closeDialog();
              callback(url);
            } else {
              alert('请输入完整的URL');
            }
          }
        }
      ]
    });

    // 自动聚焦到输入框
    setTimeout(() => {
      const input = document.getElementById('douyinUrlInput');
      if (input) input.focus();
    }, 100);

    // 处理回车键
    document.getElementById('douyinUrlInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const url = e.target.value.trim();
        if (url) {
          this.closeDialog();
          callback(url);
        }
      }
    });
  }

  /**
   * 显示通用引导
   */
  showGenericGuidance(shortLink, callback) {
    const dialog = this.createDialog({
      title: '🔗 短链接解析',
      content: `
        <div style="text-align: center; padding: 20px;">
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">⚠️ 需要手动获取完整链接</h3>
            <p style="color: #856404; line-height: 1.6;">
              无法自动解析此短链接，请手动获取完整URL。
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${shortLink}" target="_blank" 
               style="display: inline-block; background: #007bff; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              🔗 打开短链接
            </a>
          </div>

          <div style="margin: 20px 0;">
            <input type="text" id="genericUrlInput" 
                   placeholder="请粘贴完整URL到这里..." 
                   style="width: 100%; padding: 12px; border: 2px solid #ddd; 
                          border-radius: 8px; font-size: 14px; box-sizing: border-box;">
          </div>
        </div>
      `,
      buttons: [
        {
          text: '取消',
          style: 'background: #6c757d; color: white;',
          action: () => {
            this.closeDialog();
            callback(null);
          }
        },
        {
          text: '确认',
          style: 'background: #28a745; color: white;',
          action: () => {
            const url = document.getElementById('genericUrlInput').value.trim();
            if (url) {
              this.closeDialog();
              callback(url);
            } else {
              alert('请输入完整的URL');
            }
          }
        }
      ]
    });

    setTimeout(() => {
      const input = document.getElementById('genericUrlInput');
      if (input) input.focus();
    }, 100);
  }

  /**
   * 创建对话框
   */
  createDialog({ title, content, buttons }) {
    const dialogHtml = `
      <div id="smartRedirectDialog" style="
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.6); z-index: 10000; 
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
      ">
        <div style="
          background: white; border-radius: 15px; max-width: 500px; width: 90%; 
          max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          animation: slideIn 0.3s ease;
        ">
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 20px; border-radius: 15px 15px 0 0;
            text-align: center;
          ">
            <h2 style="margin: 0; font-size: 20px;">${title}</h2>
          </div>
          
          <div style="padding: 0;">
            ${content}
          </div>
          
          <div style="
            padding: 20px; border-top: 1px solid #eee; 
            display: flex; justify-content: flex-end; gap: 10px;
          ">
            ${buttons.map(btn => `
              <button onclick="window.smartRedirectHandler.handleButtonClick('${btn.text}')" 
                      style="
                        ${btn.style} border: none; padding: 10px 20px; 
                        border-radius: 6px; cursor: pointer; font-size: 14px;
                        transition: all 0.2s ease;
                      "
                      onmouseover="this.style.transform='scale(1.05)'"
                      onmouseout="this.style.transform='scale(1)'">
                ${btn.text}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
      
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      </style>
    `;

    const dialogElement = document.createElement('div');
    dialogElement.innerHTML = dialogHtml;
    document.body.appendChild(dialogElement);

    // 存储按钮动作
    this.currentButtons = buttons;

    // 处理ESC键
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        this.closeDialog();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    return dialogElement;
  }

  /**
   * 处理按钮点击
   */
  handleButtonClick(buttonText) {
    const button = this.currentButtons.find(btn => btn.text === buttonText);
    if (button && button.action) {
      button.action();
    }
  }

  /**
   * 关闭对话框
   */
  closeDialog() {
    const dialog = document.getElementById('smartRedirectDialog');
    if (dialog) {
      dialog.remove();
    }
  }
}

// 创建全局实例
window.smartRedirectHandler = new SmartRedirectHandler();

// 导出给其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartRedirectHandler;
}
