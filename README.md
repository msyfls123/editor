# Editor

基于 Cloudflare Workers 的富文本编辑器：React + Lexical 负责编辑，Hono 提供 HTTP 入口（WebSocket 为后续能力），D1 保存文章与资源元数据，共享 `auth` D1 保存登录态，Durable Object 的 SQLite 保存每篇文章的版本快照。

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
| 认证 | `@ebichu-cc/auth`（共享 `auth` D1） |
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
    W -->|AUTH_DB| AD[(D1: auth)]
    W -->|getByName docId| DO[Durable Object 每文档一个]
    DO --> S[(SQLite: document_versions)]
    W -->|上传 / 读取| R[(R2: 资源文件)]
```

- 一个 `docId` 对应一个 Durable Object，版本读写在该文档内天然串行化。
- D1 是文章、资源和关联关系的索引；DO 是版本号与版本内容的真相源。
- R2 只存文件字节，资源的归属、哈希和状态在 D1。

## 数据存储

- D1 表结构在 `migrations/0001_init.sql`，用 `pnpm wrangler d1 migrations apply editor --local` 应用到本地。
- DO 的 schema 在 `src/server/EditorServerDurable.ts` 内，通过 `PRAGMA user_version` 在构造函数中自动迁移。
- `AUTH_DB` 绑定共享 `auth` D1，仅用于读取登录态和退出登录；迁移由 login worker 负责。
- 图片 URL 统一为线上 `https://media.ebichu.cc/<key>`，本地由 `ImageNode` 换成 `/media?key=<key>`；`/media` 不做鉴权。

## 兼容性

- 旧 R2 key（如 `editor/default/**`、`editor/**`）不移动、不删除，原 CDN URL 和本地 `/media?key=` 都可继续读取。
- `localStorage` 的 `EDITOR_STATE` 结构未变；旧图片节点仍能正常显示。
- 新上传：登录用户写入 `u/<ownerId>/<sha256>.<ext>`，匿名用户写入 `anonymous/image/<sha256>.<ext>`。
- 本地联调登录态时，editor 与 login worker 需要共享同一个 `AUTH_DB` 本地持久化目录（例如同一个 `--persist-to`），否则 `/api/me` 会返回 401。
- R2 只存资源文件；资源元数据、可见性和归属以 D1 为准。

## 本地登录联调

editor 与 login worker 通过 `persistState` 共享同一个本地状态目录：

| 项目 | 配置 | 实际目录 |
| --- | --- | --- |
| editor | `persistState: { path: '../.ebichu-state' }` | `D:\git\.ebichu-state\v3` |
| login | `persistState: { path: '../../../.ebichu-state' }` | 同上 |

启动：

```txt
# D:\git\ebichu
pnpm dev:login   # http://localhost:4321

# D:\git\editor
pnpm dev         # http://localhost:5173
```

开发模式下，editor 的登录按钮会指向 `http://<当前主机>:4321/login`，登录成功后回跳。

首次或清空本地状态后，需要分别应用 migration：

```txt
# editor
pnpm wrangler d1 migrations apply editor --local --persist-to ../.ebichu-state

# 在 ../ebichu/apps/ebichu-login 下
pnpm exec wrangler d1 migrations apply auth --local --persist-to ../../../.ebichu-state
```

## 当前状态

截至 2026-11-25：

| 能力 | 状态 |
| --- | --- |
| Lexical 富文本编辑（格式、列表、代码、链接、表格、图片、Mermaid 图） | 已具备 |
| 临时编辑（`localStorage`） | 已具备 |
| 手动保存 + 未保存状态 | 待实现，见 SPEC FR-2 / FR-1.6 |
| 登录与联网编辑（`@ebichu-cc/auth`） | 登录态展示、登录跳转、退出登录已接入；联网编辑待接入 |
| D1 文章元信息 | `migrations/0001_init.sql` 已添加，D1 访问接口待接入 |
| DO 版本存储 | SQLite schema 与 `saveVersion` 骨架已添加；HTTP API 待接入；WebSocket echo 仍在 |
| DO WebSocket 广播 | MVP 不需要；联网保存走 HTTP |
| 版本历史 / 恢复 | 待实现 |
| 离线 pending 队列 | 待实现 |
| 用户资源库 | `/api/resources` 上传/列表/软删除已实现；`/resources` 页面已接入；登录用户走资源库，匿名仍走 `/image` → `anonymous/image/`；图片 URL 线上走 CDN，本地走 `/media?key=` |

## 目录

```txt
src/
  client/
    pages/
      editor.tsx                # 编辑器页面入口（含 WebSocket demo）
      resources.tsx             # 资源库页面入口
    editor/
      index.tsx                 # 编辑器入口，接本地持久化
      editor.tsx                # LexicalExtensionComposer 与扩展配置
      hooks/usePersistence.ts   # 当前：localStorage 持久化
      plugins/                  # Image / Link / Diagram / TableToolbar
      toolbar/                  # 工具栏按钮
      theme/                    # Lexical 主题
    components/ui/              # shadcn/base-ui 组件
    components/PageLayout.tsx   # Toaster + AuthProvider + 页面头部
    components/AuthMenu.tsx     # 登录态、头像、退出登录、资源库入口
    components/AuthProvider.tsx # 登录态共享 Context
    components/ResourcesPage.tsx# 资源库列表与分页
    lib/                        # 图片读取、登录跳转、className 工具
  server/
    index.tsx                   # Hono 入口、SSR、媒体与登录态路由
    auth.ts                     # @ebichu-cc/auth + 共享 AUTH_DB
    resources.ts                # /api/resources + 匿名 /image
    EditorServerDurable.ts      # DO：SQLite schema + saveVersion 骨架（WebSocket echo 仍在）
    utils/hash.ts               # 完整 SHA-256（上传去重）
  server/style.css
migrations/0001_init.sql        # D1: articles / resources / article_resources
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
| M5 | 用户资源库：管理 UI、文章引用与 GC（上传/列表/软删除 API 已完成） |
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
| `pnpm wrangler d1 migrations apply editor --local` | 本地应用 D1 migration |
| `pnpm wrangler d1 migrations apply editor --remote` | 远端应用 D1 migration |
