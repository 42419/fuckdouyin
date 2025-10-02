# 抖音视频下载工具

一个简单易用的抖音视频下载工具，支持通过视频ID、分享链接或短链接获取抖音视频信息并提供下载选项。本项目提供多种部署方式，支持本地开发调试和云端快速部署。

## 功能特点

- 支持多种输入格式：视频ID、完整链接、短链接
- 自动解析视频信息（标题、作者、时长、统计数据等）
- 提供多种画质和分辨率的下载选项
- 多重后端支持：Node.js Express、Cloudflare Functions、Cloudflare Workers
- 智能重定向处理：解决抖音短链接跨域问题
- 优雅的错误处理和用户提示
- **智能主题切换功能**：支持自动跟随系统主题变化
- **跨设备兼容**：桌面端支持左键/右键操作，移动端支持点击/长按操作
- **统一体验**：所有设备默认启用自动模式，确保一致的用户体验

## 环境要求

- 本地开发：需要安装 [Node.js](https://nodejs.org/zh-cn/)（推荐v18或更高版本）
- 部署平台：免费的Cloudflare账户或支持Netlify Functions的平台
- 现代浏览器（Chrome、Firefox、Edge等）

## 项目结构

```
├── .gitignore              # Git忽略文件
├── README.md               # 项目文档
├── _redirects              # Netlify重定向规则
├── assets/                 # 静态资源
│   ├── css/styles.css      # 样式文件
│   └── js/                 # JavaScript脚本
│       ├── script.js       # 主脚本
│       ├── frontend-redirect.js  # 前端重定向处理
│       └── smart-redirect.js     # 智能重定向处理
├── functions/              # Cloudflare/Netlify Functions
│   └── api/                # API端点
│       ├── download.js     # 视频下载API
│       ├── redirect.js     # 重定向处理API
│       ├── test.js         # 测试API
│       └── third-party-redirect.js  # 第三方重定向API
├── index.html              # 主页面
├── package.json            # Node.js项目配置
├── package-lock.json       # 依赖锁定文件
├── server.js               # 本地Express服务器
├── test-browser.html       # 浏览器测试页面
├── test-redirect.html      # 重定向测试页面
├── theme-test.html         # 主题测试页面
├── version.json            # 版本信息
├── workers/                # Cloudflare Workers
│   └── redirect-expander/
│       ├── wrangler.toml   # Worker配置
│       └── src/index.ts    # Worker代码
└── wrangler.toml           # 根级Cloudflare配置
```

## 使用方法

### 在浏览器中使用工具

打开浏览器，访问应用地址即可使用工具。

### 下载视频步骤

1. 在输入框中粘贴抖音视频链接、视频ID或短链接
2. 点击"下载"按钮
3. 等待解析完成后，选择合适的画质和分辨率进行下载

### 主题切换功能使用指南

#### 自动模式（默认）
- **所有设备**默认启用自动模式
- 页面会自动跟随系统主题变化（明/暗模式）
- 重新进入页面时会自动重置为自动模式

#### 桌面设备操作
- **左键点击**主题按钮：切换明暗模式（退出自动模式）
- **右键点击**主题按钮：切换自动/手动模式

#### 移动设备操作
- **点击**主题按钮：切换明暗模式（退出自动模式）
- **长按**主题按钮（500毫秒）：切换自动/手动模式

#### 操作提示
- 页面加载时会显示当前模式状态
- 操作时会显示相应的提示信息
- 提示信息3秒后自动消失，也可手动关闭

## 本地开发

### 环境设置

1. 安装Node.js（版本18+推荐）
2. 克隆项目代码到本地
3. 进入项目目录

### 安装依赖和启动

```bash
# 安装依赖
npm install

# 启动本地服务器（生产模式）
npm start

# 启动开发模式（支持热重载）
npm run dev
```

服务器将在 http://localhost:3000 启动。

### 测试页面

项目包含多个测试页面，方便开发调试：

- http://localhost:3000/test-browser.html - 浏览器兼容性测试
- http://localhost:3000/test-redirect.html - 重定向功能测试
- http://localhost:3000/theme-test.html - 主题切换测试

## 部署教程

### 方式一：部署到Node.js服务器

适合需要完全控制后端的场景。

1. **服务器准备**
   - 确保服务器安装Node.js 18+
   - 上传项目代码到服务器

2. **安装和启动**
   ```bash
   cd /path/to/project
   npm install --production
   npm start
   ```

3. **配置服务**
   - 使用PM2或systemd管理进程
   - 配置反向代理（如nginx）
   - 设置SSL证书

4. **访问**
   - 默认端口3000，可通过代理暴露80/443端口
   - 示例：https://your-domain.com

### 方式二：部署到Cloudflare Pages + Functions

推荐的免费云部署方式，支持CDN加速。

#### 前提条件
- 免费Cloudflare账户
- 代码托管在GitHub、GitLab或Bitbucket

#### 部署步骤

1. **登录Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com/
   - 登录您的账户

2. **创建Pages项目**
   - 选择左侧"Pages"选项
   - 点击"Create a project" → "Connect to Git"
   - 授权访问代码仓库
   - 选择项目仓库

3. **配置构建设置**
   - 分支：选择main或master
   - Build settings：
     - Framework preset: None
     - Build command: 留空
     - Build output directory: 留空
   - Cloudflare自动检测functions目录

4. **部署和访问**
   - 点击"Save and Deploy"
   - 等待部署完成
   - 获得 xxx.pages.dev 域名访问
   - 可在Pages设置中绑定自定义域名

### 方式三：使用Cloudflare Workers

最强大的无服务器解决方案，支持多接口。

#### 安装Wrangler CLI

```bash
npm install -g wrangler
```

#### 配置认证

```bash
wrangler auth login
```

#### 部署Workers

```bash
# 进入Workers目录
cd workers/redirect-expander

# 部署Worker
wrangler deploy
```

#### 部署后配置

访问Cloudflare Dashboard → Workers → Your Worker：

1. 配置路由（Routes）
2. 设置域名绑定
3. 配置环境变量（如需要）

#### 测试Workers API

部署完成后，可通过以下接口测试：

- `https://your-worker.your-account.workers.dev/expand?url=短链接`
- `https://your-worker.your-account.workers.dev/download?url=视频链接`

### 方式四：部署到Netlify

如果使用Netlify托管，支持自动部署。

1. **连接仓库**
   - 在Netlify Dashboard创建新站点
   - 连接GitHub/GitLab仓库
   - 选择分支

2. **构建设置**
   - Build command: 留空
   - Publish directory: .
   - Functions directory: functions

3. **部署**
   - 可启用自动部署
   - 获得自动分配域名或绑定自定义域名

## 关于抖音短链接处理

由于浏览器的CORS限制，直接前端处理抖音短链接会失败。本工具通过多层后端解决：

1. **Cloudflare Functions/Workers**：生产环境推荐，边缘计算，无跨域限制
2. **Node.js代理**：本地开发和自建服务器
3. **用户引导**：自动检测抖音短链接，引导用户手动获取完整URL

## 注意事项

- 本工具仅用于学习研究，请遵守抖音使用协议
- 功能依赖外部API，API不可用时会降级处理
- Cloudflare免费额度有限，超出可能产生费用
- 建议定期更新依赖以修复安全漏洞

## 常见问题

### Q: 部署后无法连接到API？
**A:** 检查网络连接和API可用性。可能是CORS问题，需配置服务端CORS策略。

### Q: 抖音短链接无法解析？
**A:** Cloudflare部署自动启用重定向处理。如失败，提供手动输入完整URL的选项。

### Q: 视频下载没有声音？
**A:** 可能是抖音音视频分离存储，工具会优先获取包含音频的全格式视频。

### Q: Cloudflare部署失败？
**A:** 检查functions目录结构和代码语法。也可能需要更新wrangler版本。

### Q: 如何自定义域名？
**A:** 在Cloudflare/Pages/Netlify控制台设置添加自定义域名，系统会自动配置DNS和SSL。

## 贡献

欢迎提交Issue和Pull Request！请确保：

- 遵循现有的代码风格
- 新功能包含相应的测试
- 提交前运行 `npm test`

## 许可证

MIT License - 详见LICENSE文件
