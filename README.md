# Editor

基于 Cloudflare Workers 的富文本编辑器：React + Lexical 负责编辑，Hono 提供 HTTP 入口（WebSocket 为后续能力），D1 保存文章与资源元数据，Durable Object 的 SQLite 保存每篇文章的版本快照。

## 文档分工

| 文档 | 内容 |
| --- | --- |
| [SPEC.md](./SPEC.md) | 产品与接口契约：范围、数据模型、API、并发规则、验收标准 |
| README.md | 快速开始、当前状态、目录结构、路线图 |

实现与接口冲突时，以 SPEC 为准；SPEC 未覆盖的细节再回到 README 或代码中确认。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 运行时 | Cloudflare Workers（`workerd`）、Durable Objects（SQLite）、D1、R2 |
| 服务端 | Hono、`vite-ssr-components`（注入 Vite 资源） |
| 客户端 | React 19、Lexical 0.53 |
| 构建 | Vite 8 + `@cloudflare/vite-plugin`、Tailwind CSS 4、shadcn/base-ui |
| 认证 | `@ebichu-cc/auth`（待接入） |
| 类型 | `wrangler types` 生成 `Env` 与 Worker 运行时类型 |

## 快速开始

```txt
pnpm install
pnpm dev
```

```txt
pnpm build
pnpm preview
pnpm deploy
```

修改 `wrangler.jsonc` 或新增绑定后重新生成类型：

```txt
pnpm cf-typegen
```

本地 DO 的 SQLite 数据默认在 `.wrangler/state`；修改 schema 需要重来时，可以清掉该目录。

## 架构

```mermaid
flowchart LR
    B[Browser: React + Lexical] -->|HTTP /api| W[Hono Worker]
    B -.->|WebSocket 后续能力| W
    W -->|登录态| A[@ebichu-cc/auth]
    W -->|docId / 作者| D1[(D1: articles / resources)]
    W -->|getByName docId| DO[Durable Object 每文档一个]
    DO --> S[(SQLite: document_versions)]
    W -->|上传 / 读取| R[(R2: 资源文件)]
```

- 一个 `docId` 对应一个 Durable Object，版本读写在该文档内天然串行化。
- D1 是文章、资源和关联关系的索引；DO 是版本号与版本内容的真相源。
- R2 只存文件字节，资源的归属、哈希和状态在 D1。

## 当前状态

截至 2026-11-25：

| 能力 | 状态 |
| --- | --- |
| Lexical 富文本编辑（格式、列表、代码、链接、表格、图片、Mermaid 图） | 已具备 |
| 临时编辑（`localStorage`） | 已具备 |
| 手动保存 + 未保存状态 | 待实现，见 SPEC FR-2 / FR-1.6 |
| 登录与联网编辑（`@ebichu-cc/auth`） | 待接入 |
| D1 文章元信息 | 已声明绑定，代码未使用 |
| DO 版本存储 | 当前是 WebSocket echo demo，与版本存储无关 |
| DO WebSocket 广播 | MVP 不需要；联网保存走 HTTP |
| 版本历史 / 恢复 | 待实现 |
| 离线 pending 队列 | 待实现 |
| 用户资源库 | 当前只有原型级图片上传（`PUT /image`），待改造为带鉴权、含 `private`/`public` 可见性的资源库 |

## 目录

```txt
src/
  client/
    app.tsx                     # React 入口
    Root.tsx                    # 页面外壳（含 WebSocket demo）
    editor/
      index.tsx                 # 编辑器入口，接本地持久化
      editor.tsx                # LexicalExtensionComposer 与扩展配置
      hooks/usePersistence.ts   # 当前：localStorage 持久化
      plugins/                  # Image / Link / Diagram / TableToolbar
      toolbar/                  # 工具栏按钮
      theme/                    # Lexical 主题
    components/ui/              # shadcn/base-ui 组件
    lib/                        # 图片读取、className 工具
  server/
    index.tsx                   # Hono 入口、SSR、媒体路由
    EditorServerDurable.ts      # Durable Object（当前为 echo demo）
    utils/hash.ts               # 流式 SHA-256
  server/style.css
wrangler.jsonc                  # D1 / R2 / DO 绑定
SPEC.md
```

## 路线图

| 阶段 | 内容 |
| --- | --- |
| M1 | 接入 `@ebichu-cc/auth`，D1 文章创建/列表/读取/改标题 |
| M2 | DO 版本 schema、手动保存、未保存状态 |
| M3 | 版本列表、只读预览、恢复 |
| M4 | 离线 pending 队列与重连提交 |
| M5 | 用户资源库：上传、去重、列表、软删除、文章引用 |
| M6 | 自动保存、WebSocket 广播、协同编辑、公开分享 |

详细需求、接口与验收标准见 [SPEC.md](./SPEC.md)。

## 相关命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Vite + workerd 本地开发 |
| `pnpm build` | 构建 |
| `pnpm preview` | 构建并本地预览 |
| `pnpm deploy` | 构建并部署到 Cloudflare |
| `pnpm cf-typegen` | 根据 `wrangler.jsonc` 重新生成 `Env` 类型 |
