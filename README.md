# 抖音视频下载工具

一个简单易用的抖音视频下载工具，支持通过视频ID、分享链接或短链接获取抖音视频信息并提供下载选项。

## 功能特点

- 支持多种输入格式：视频ID、完整链接、短链接
- 自动解析视频信息（标题、作者、时长、统计数据等）
- 提供多种画质和分辨率的下载选项
- 使用Cloudflare Functions或Node.js代理解决抖音短链接重定向问题
- 优雅的错误处理和用户提示

## 环境要求

- 本地开发：需要安装 [Node.js](https://nodejs.org/zh-cn/)（推荐v14或更高版本）
- Cloudflare Pages部署：免费的Cloudflare账户
- 现代浏览器（Chrome、Firefox、Edge等）

## 项目结构

```
├── .gitignore
├── README.md
├── assets/           # 静态资源文件
│   ├── css/          # 样式文件
│   │   └── styles.css
│   └── js/           # JavaScript脚本
│       └── script.js
├── functions/        # Cloudflare Functions代码
│   └── api/          # API函数
│       └── redirect.js
├── static/           # 其他静态资源（图片等）
├── index.html        # 主页面
├── package-lock.json # 依赖锁定文件
├── package.json      # 项目配置和依赖
└── server.js         # Node.js服务器（本地开发用）
```

## 本地开发

### 安装依赖

1. 打开命令行终端，进入项目目录
2. 运行以下命令安装依赖：

```bash
npm install
```

### 启动本地服务器

```bash
npm start
```

服务器将在 http://localhost:3000 启动。

### 开发模式

如果您是开发者，可以使用开发模式运行，支持自动重启服务器：

```bash
npm run dev
```

## 使用方法

### 在浏览器中使用工具

打开浏览器，访问应用地址（本地为 http://localhost:3000 ）即可使用工具。

### 下载视频步骤

1. 在输入框中粘贴抖音视频链接、视频ID或短链接
2. 点击"下载"按钮
3. 等待解析完成后，选择合适的画质和分辨率进行下载

## 关于抖音短链接处理

由于浏览器的安全限制（CORS策略和内容安全策略），直接在前端处理抖音短链接会遇到跨域问题。本工具通过以下方式解决：

1. **Cloudflare Functions**：在Cloudflare Pages部署时，使用Cloudflare Functions处理短链接的重定向请求
2. **Node.js代理服务**：在本地开发时，使用Node.js服务器作为代理
3. **用户交互备用方案**：如果代理服务不可用，提供手动方式让用户复制完整链接

## 部署到Cloudflare Pages

### 前提条件

- 一个免费的Cloudflare账户
- 已将代码托管到GitHub、GitLab或Bitbucket

### 部署步骤

1. **登录Cloudflare账户**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 使用您的账户登录

2. **创建Pages项目**
   - 在Dashboard中，选择左侧导航栏的"Pages"选项
   - 点击"Create a project"按钮
   - 选择"Connect to Git"
   - 授权Cloudflare访问您的代码仓库
   - 选择要部署的仓库

3. **配置构建设置**
   - 选择主分支（通常是main或master）
   - 在"Build settings"部分：
     - **Framework preset**: 选择"None"
     - **Build command**: 留空（不需要构建命令）
     - **Build output directory**: 留空（默认为根目录）
   - Cloudflare会自动检测并使用项目中的`functions`目录

4. **部署项目**
   - 点击"Save and Deploy"按钮开始部署
   - Cloudflare Pages会自动构建并部署您的项目
   - 部署完成后，您将获得一个`.pages.dev`域名的访问链接

### 自定义域名（可选）

如果您想使用自己的域名访问项目：

1. 在Pages项目的设置中，选择"Custom domains"
2. 点击"Set up a custom domain"
3. 按照提示添加并验证您的域名
4. Cloudflare会自动配置DNS记录和SSL证书

## 注意事项

- 本工具仅供学习和研究使用，下载视频请遵守抖音的用户协议
- 工具依赖于外部API服务，如果API不可用，将无法获取视频信息
- 部署到Cloudflare Pages后，短链接处理功能将自动使用Cloudflare Functions
- Cloudflare Pages有一定的免费使用额度，超出后可能产生费用

## 常见问题

### Q: 为什么部署后无法连接到API？
**A:** 请检查网络连接是否正常，以及外部API服务是否可用。如果是CORS错误，可能需要配置API服务的CORS策略。

### Q: 使用短链接时为什么提示错误？
**A:** 在Cloudflare Pages上，短链接处理由Cloudflare Functions提供。如果遇到问题，工具会自动切换到手动输入模式。

### Q: 为什么下载的视频没有声音？
**A:** 这可能是由于抖音的音频和视频流分离导致的，工具会尝试获取包含音频的完整视频。

### Q: Cloudflare Pages部署后，短链接功能不工作怎么办？
**A:** 请检查`functions/api/redirect.js`文件是否存在且格式正确。您可以在Cloudflare Dashboard的"Functions"选项卡中查看函数的运行日志和错误信息。