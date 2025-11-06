# 抖音视频下载工具

一个基于 Cloudflare 全家桶的抖音视频解析下载工具。通过第三方 API 获取抖音视频直链，使用 Cloudflare Workers 代理下载。本地通过 Express 服务器提供开发测试环境。

## 🏗️ 项目架构

本项目采用分层架构设计，充分利用 Cloudflare 的无服务器能力：

### 1. **Cloudflare Pages** - 前端托管
- 托管静态资源：HTML、CSS、JavaScript
- 提供用户界面和交互逻辑

### 2. **Cloudflare Functions** - 短链重定向处理
- 部署在 Pages Functions 中，与前端同域
- 处理抖音短链接的重定向，避免 CORS 问题
- 路径：`/api/redirect?url=<短链接>`

### 3. **Cloudflare Workers** - 代理下载服务
- 独立部署的 Workers 服务
- 提供视频下载代理和短链展开功能
- 域名：`redirect-expander.liyunfei.eu.org`
- 接口：
  - `/expand?url=<短链接>` - 展开短链接
  - `/download?url=<视频直链>` - 代理下载视频

### 4. **本地开发环境**
- Express 服务器模拟生产环境 API
- 便于开发调试和功能测试

## ✨ 功能特点

- 🎯 **多格式输入支持**：视频ID、完整链接、短链接
- 📊 **智能视频解析**：自动获取标题、作者、时长、统计数据
- 🎬 **多分辨率下载**：提供多种画质和分辨率选项
- 🔄 **智能重定向**：自动处理抖音短链接跨域问题
- 🎨 **主题切换**：支持明暗模式，自动跟随系统主题
- 📱 **跨设备兼容**：桌面端和移动端操作优化
- 🛡️ **优雅错误处理**：完善的错误提示和降级方案

## 🚀 快速开始

### 环境要求
- Node.js 18+（本地开发）
- Cloudflare 账户（生产部署）
- 现代浏览器

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd fkdouyin

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 开始开发调试。

## 📦 部署指南

### 推荐部署方案：Cloudflare Pages + Functions + Workers

#### 1. 部署 Cloudflare Pages（前端）
```bash
# 连接 GitHub 仓库到 Cloudflare Pages
# 在 Dashboard 中创建 Pages 项目
# 自动检测 functions 目录并部署
```

#### 2. 部署 Cloudflare Workers（代理服务）
```bash
# 安装 Wrangler CLI
npm install -g wrangler
wrangler auth login

# 部署 Workers
cd workers/redirect-expander
wrangler deploy
```

#### 3. 配置域名
- Pages 自动分配 `*.pages.dev` 域名
- Workers 绑定自定义域名 `redirect-expander.liyunfei.eu.org`

### 其他部署方式

#### Node.js 服务器
```bash
npm install --production
npm start
```

#### Netlify
- 连接 GitHub 仓库
- 设置 Functions 目录为 `functions`
- 自动部署

## 📖 使用方法

### 下载抖音视频

1. **输入链接**：在输入框粘贴抖音视频链接
2. **解析视频**：点击"解析"按钮获取视频信息
3. **选择画质**：从提供的分辨率选项中选择
4. **下载视频**：点击下载链接开始下载

### 支持的输入格式

- 视频ID：`730243852892`
- 完整链接：`https://www.douyin.com/video/730243852892`
- 短链接：`https://v.douyin.com/abc123/`

### 主题切换

- **自动模式**（默认）：跟随系统主题变化
- **手动模式**：点击切换明暗主题
- **桌面端**：右键切换自动/手动模式
- **移动端**：长按切换自动/手动模式

## 🔧 项目结构

```
├── index.html                 # 主页面
├── server.js                  # 本地开发服务器
├── package.json              # 项目配置
├── wrangler.toml             # Cloudflare 配置
├── assets/                   # 静态资源
│   ├── css/styles.css        # 样式文件
│   └── js/
│       ├── script.js         # 前端逻辑
│       ├── smart-redirect.js # 重定向处理
│       └── frontend-redirect.js
├── functions/                # Cloudflare Functions
│   └── api/
│       ├── redirect.js       # 短链重定向
│       ├── download.js       # 下载代理
│       └── test.js           # 测试接口
├── workers/                  # Cloudflare Workers
│   └── redirect-expander/
│       ├── wrangler.toml     # Worker 配置
│       └── src/index.ts      # Worker 代码
└── test-*.html              # 测试页面
```

## 🔄 工作流程

1. **前端处理**：用户输入抖音链接
2. **短链解析**：调用 Functions 处理重定向
3. **视频解析**：通过第三方 API 获取视频信息
4. **链接提取**：解析不同分辨率的下载链接
5. **代理下载**：通过 Workers 代理下载视频文件

## ⚠️ 注意事项

- 本工具仅用于学习研究，请遵守相关平台使用协议
- 依赖第三方 API 服务，API 不可用时会影响功能
- Cloudflare 免费额度有限，建议监控使用量
- 定期更新依赖以确保安全性

## 🐛 常见问题

### Q: 短链接无法解析？
**A:** 检查网络连接，或尝试手动复制完整 URL。

### Q: 下载失败？
**A:** 确认视频链接有效，检查网络连接和浏览器设置。

### Q: CORS 错误？
**A:** 生产环境使用 Cloudflare 服务自动解决 CORS 问题。

### Q: Workers 部署失败？
**A:** 检查 `wrangler.toml` 配置和认证状态。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

- 遵循现有代码风格
- 新功能请包含相应测试
- 提交前请确保代码质量

## 📄 许可证

MIT License
