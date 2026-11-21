# 以太残响前端

## 开发与验证

- `npm ci` 安装锁定的依赖。
- `npm run dev` 启动 Vite。
- `npm run build` 执行 TypeScript 检查和生产构建。
- `npx playwright test` 验证前端交互。使用 Playwright 自带 Chromium，或将 `PLAYWRIGHT_CHANNEL` 设为机器已安装的浏览器通道。

模块按设计、实现、浏览器验证、修正的顺序迭代。设计见 DESIGN-DOC.md，阶段记录见 PROGRESS.md。新增生成素材的提示词保存在 assets/prompts。日志和浏览器测试输出留在本地，测试日志可写入 .logs。
