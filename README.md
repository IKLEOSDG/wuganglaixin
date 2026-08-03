# 雾港来信

原创中文网页解谜游戏。玩家需要观察现场照片、检索海事档案、破解报纸藏头与摩斯电码，并复原路线找到失踪的林岚。

## 本地运行

```bash
npm install
npm run dev
```

默认访问 `http://localhost:3000`（端口占用时 Vite 会自动选择下一端口）。

## Cloudflare Pages

这是纯静态 Vite 项目，Pages 项目请使用：

- Production branch：`main`
- Build command：`npm run build`
- Build output directory：`dist`
- Node.js version：`22` 或更高

仓库内的 `public/_redirects` 会在构建后复制到输出目录，确保直接访问页面也能回退到游戏入口。

如果站点返回 Cloudflare 404，通常表示 Pages 项目还没有一次成功的生产部署，或输出目录没有设为 `dist`。在 Pages 的部署记录中重新运行最新的 `main` 分支即可。
