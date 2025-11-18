const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const SRC_ASSETS = path.join(ROOT, 'assets');
const DIST = path.join(ROOT, 'dist');

function rimraf(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function hashOf(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex').slice(0, 8);
}

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function isCSS(p) {
  return /assets[\\\/]css[\\\/].+\.css$/i.test(p);
}

function isJS(p) {
  return /assets[\\\/]js[\\\/].+\.js$/i.test(p);
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function build() {
  rimraf(DIST);
  ensureDir(DIST);

  const assetFiles = walk(SRC_ASSETS);
  const manifest = new Map(); // oldRel -> newRel

  // 1) 处理 CSS/JS：带 hash 文件名
  for (const abs of assetFiles) {
    const r = rel(abs);
    if (isCSS(r) || isJS(r)) {
      const buf = fs.readFileSync(abs);
      const h = hashOf(buf);
      const parsed = path.parse(r);
      const hashedName = `${parsed.name}.${h}${parsed.ext}`;
      const newRel = path.join(parsed.dir, hashedName).replace(/\\/g, '/');
      const outPath = path.join(DIST, newRel);
      copyFile(abs, outPath);
      manifest.set(r, newRel);
    }
  }

  // 2) 复制其余 assets 原样
  for (const abs of assetFiles) {
    const r = rel(abs);
    if (!(isCSS(r) || isJS(r))) {
      const outPath = path.join(DIST, r);
      copyFile(abs, outPath);
    }
  }

  // 3) 处理根目录 HTML：替换引用，写入 dist 根
  const rootEntries = fs.readdirSync(ROOT, { withFileTypes: true });
  for (const e of rootEntries) {
    if (e.isFile() && e.name.toLowerCase().endsWith('.html')) {
      const srcPath = path.join(ROOT, e.name);
      let html = fs.readFileSync(srcPath, 'utf8');

      // 通用替换函数：替换 href/src 中的 assets/(css|js)/... 路径
      html = html.replace(/(href|src)="(assets\/(?:css|js)\/[^"?]+)"/g, (m, attr, p2) => {
        const key = p2;
        if (manifest.has(key)) {
          return `${attr}="${manifest.get(key)}"`;
        }
        // 兼容可能路径已包含 ./ 或 / 前缀
        const alt1 = key.replace(/^\.\//, '');
        if (manifest.has(alt1)) return `${attr}="${manifest.get(alt1)}"`;
        const alt2 = key.replace(/^\//, '');
        if (manifest.has(alt2)) return `${attr}="${manifest.get(alt2)}"`;
        return m;
      });

      // 写入到 dist 根
      copyFile(srcPath, path.join(DIST, e.name));
      fs.writeFileSync(path.join(DIST, e.name), html, 'utf8');
    }
  }

  // 4) 复制其他根文件（常见静态与配置）
  const rootCopyList = ['version.json', '_redirects', 'favicon.ico'];
  for (const name of rootCopyList) {
    const p = path.join(ROOT, name);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      copyFile(p, path.join(DIST, name));
    }
  }

  // 5) 生成 _headers
  const headers = `
/index.html
  Cache-Control: no-cache, no-store, must-revalidate

/*.html
  Cache-Control: no-cache, no-store, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`.trimStart();
  fs.writeFileSync(path.join(DIST, '_headers'), headers, 'utf8');

  // 输出 manifest 便于排障
  fs.writeFileSync(path.join(DIST, 'asset-manifest.json'), JSON.stringify(Object.fromEntries(manifest), null, 2));

  console.log(`构建完成：dist/ 生成成功。\n已处理 ${manifest.size} 个带hash的静态资源。`);
}

build();
