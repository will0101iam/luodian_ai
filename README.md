# 落点 AI 官网与案例库

咨询商务风格的企业 AI 转型官网与业务方案库。根路径是服务官网，方案库覆盖 14 个行业与 193 篇参考方案。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 内容边界

- 全部内容标记为 `参考方案`，人物与企业背景为虚构，不是既有客户案例。
- 指标给出测量口径，不宣称已经取得实测收益。
- 公开研究线索保留在内部 `research/` 和 `findings.md`，来源正文、销售话术与客户成果不进入公开数据。
- 当前需求单仅在浏览器本地生成，不上传信息。

## 页面与验证

- 官网：`/`
- 案例库：`/cases/`
- 示例详情：`/cases/?case=case-096`
- 收藏：`/cases/?saved=1`
- 筛选与分页写入 URL，详情返回时保留筛选；收藏保存在当前浏览器。
- 每篇详情包含 9 个章节、39 个公开字段；先用情景故事讲清楚问题与解决过程，再展开模块、流程、数据、接入、试点、验收、成本与风险。
- `npm run audit:copy` 检查来源正文泄漏、高相似标题、重复叙述、AI 套话和生成病句。
- `npm run verify:ui` 验证 193 篇详情、搜索/筛选/收藏/分页/返回/下载，以及六档屏幕宽度。
- 验证默认使用本机 Google Chrome，可通过 `CHROME_PATH` 和 `BASE_URL` 覆盖。
- 对生产构建验证：先运行 `npm run preview -- --port 4174`，再运行 `BASE_URL=http://127.0.0.1:4174 npm run verify:ui`。
- 详情页的打印按钮可通过浏览器保存 PDF。

## 案例迁移

- `npm run migrate:cases` 从 `research/snapshots/opencodev-solutions-2026-09-14.html` 重新生成案例数据。
- 脚本要求源数据严格等于 14 个行业、83 个细分场景、193 条问题记录；数量变化会直接失败。
- 迁移时排除销售脚本、第三方 Demo、设备类型和 AI 加分话术，并拒绝来源品牌与承诺型数字进入公开数据。
- `research/migration-manifest.json` 保存快照哈希、输入输出数量及排除字段。
- 页面公开身份统一为“参考方案”，不声称为落点 AI 已交付客户案例。

## 上线前必须确认

1. 将工作品牌“落点 AI”替换为正式品牌与公司主体。
2. 接入真实邮箱、企业微信、飞书表单或 CRM。
3. 根据实际交付成本确定报价或报价规则。
4. 取得首批客户授权后，再增加可核验的真实案例。

## 关键文件

- `index.html`：官网首页
- `cases/index.html`：案例库与详情页面外壳
- `src/home.js` / `src/home.css`：官网内容与视觉
- `src/library.css`：视觉系统与响应式布局
- `src/app.js`：首页、详情页、路由、检索、收藏和需求单
- `src/case-index.json`：案例库使用的 193 篇轻量索引
- `public/case-data/`：193 份按需加载的完整详情，每篇 39 个结构化字段
- `src/home-data.json`：官网使用的轻量计数与精选案例
- `src/catalog.js`：编辑分类、标签和验收口径
- `scripts/migrate-public-cases.mjs`：全量迁移与内容清洗
- `scripts/audit-public-copy.mjs`：客户可见文字与来源指纹审计
- `scripts/verify-library.mjs`：浏览器验证
- `archive/landing-v1/`：改版前的页面与样式备份
- `findings.md`：公开资料研究与定位决策
