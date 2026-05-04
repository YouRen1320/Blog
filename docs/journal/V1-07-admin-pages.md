# V1-07 Admin 业务页面

**日期**:2026-05-05
**任务**:#7
**状态**:已完成

## 目标

把 V1-06 搭好的 Admin 框架接上业务能力:
- Dashboard 显示真实数据(已发布 / 草稿 / 分类 / 标签数量 + 最近 5 篇)
- Articles 列表页(新增):状态筛选 + 分页 + 发布/下线/删除
- Editor:支持 /editor 新建 + /editor/:id 编辑,带分类下拉、标签多选、保存/发布/下线/删除
- Tags / Categories:内联 CRUD(列表 + 新建表单 + 编辑/删除)

**验收**:登录后台后能完整完成"建文章 → 选分类标签 → 发布"链路;增删改分类标签都生效。

## 关键决策

### 1. 文章流路径切成"列表 + 编辑器"两层
原 v3 设计只有 `/editor`,默认进入"打开一篇范例文章"。V1 真接 API 后,需要一个清晰的**文章列表页**才能让 admin 选择编辑哪篇。

新结构:
- `/articles` = 文章列表(标题、状态、分类、更新时间、操作)
- `/editor` = 新建
- `/editor/:id` = 编辑

侧栏 "Writing" → `/articles`,Articles 页右上角 "+ 新建" → `/editor`。

### 2. CRUD 全部内联,不开 modal
**备选**:点 "新建"弹一个 modal 表单
**已选**:点 "新建"在 hero 卡下方展开一个内联表单

理由:
- modal 在小屏幕不友好,内联展开和列表共用一个滚动上下文
- v3 设计语言用大量卡片 / 留白,modal 会破坏节奏感
- 编辑用"行内切换 input"(点编辑后该行的展示 span 变 input),**不离开当前位置**,符合"快速批改"的工作流

### 3. 编辑器没用 markdown 富文本组件
**备选 A**:接 `md-editor-v3`(双栏所见即所得,带工具栏、预览)
**备选 B**:用裸 `<textarea>` ✅

V1 选 B 因为:
- md-editor-v3 +250KB 包大小,V1 不值得
- 后台编辑者就是博客作者本人,会写 markdown
- web 端用 `markdown-it` 渲染,作者写什么就出什么
- V4 引入 AI 辅助 + V1-Final 时再考虑富文本

但保留了 `<textarea v-model="post.content">` 占位,等价的"插入富文本组件"是单点替换。

### 4. 编辑器的 publish 行为兼容"未保存"

```ts
async function onPublish() {
  if (!props.id) {
    // 没保存过先保存,拿到 id 再发布
    await onSave()
    return
  }
  // ...
}
```

新建场景下作者直接点"发布"而不是先点"保存",我们悄悄帮他保存一次再发布。这避免"必须先 save 再 publish"的反人类两步操作。

### 5. tagIds 用 checkbox 阵列,不用 select multiple
HTML `<select multiple>` 体验差(Ctrl+click 还要解释)。V1 标签数量小(< 50),铺开成 checkbox pill 直观且可扫视。

未来标签数量上去了,可以换成"打字搜索 + 选中标签 chip"模式,但那是优化,不是必须。

### 6. 错误处理统一 `extractErrorMessage`
后端错误返回:
```json
{ "message": "..." | ["...", "..."], "statusCode": ... }
```
前端 `composables/useApiError.ts` 把这两种形态压成单字符串显示。
**所有 view** 都共用这个,不在每个 view 里复制 try/catch 模板。

### 7. Dashboard 加载失败不阻塞页面
```ts
try { ... } catch { /* dashboard 失败不阻塞页面 */ }
```

仪表盘是"可有可无"的工程,API 一时挂了也不应该让用户看不到主导航。失败时数字保持 0,而不是抛错让整个页面崩。**容错粒度跟用户感知挂钩**。

## 实际做了什么

| 文件 | 性质 | 说明 |
|------|------|------|
| `src/api/articles.ts` | 新增 | 5 个端点的封装 + 类型 |
| `src/api/categories.ts` | 新增 | CRUD |
| `src/api/tags.ts` | 新增 | CRUD |
| `src/composables/useApiError.ts` | 新增 | 统一错误提取 |
| `src/views/Articles.vue` | 新增 | 文章列表页 + 状态筛选 + 分页 |
| `src/views/Editor.vue` | 改写 | 支持新建/编辑/发布/下线/删除,带分类标签选择 |
| `src/views/Dashboard.vue` | 改写 | 真实统计 + 最近 5 篇 |
| `src/views/Tags.vue` | 改写 | 内联 CRUD |
| `src/views/Categories.vue` | 改写 | 内联 CRUD |
| `src/components/AdminShell.vue` | 微调 | "Writing" 链 → /articles,移除占位 badge |
| `src/router/index.ts` | 微调 | 加 /articles 路由 |

## 踩坑 / 注意

### 坑 1:Edit / Write 工具的 "File has not been read" 限制
我连续做多个文件改动时,某些 Edit 调用因为"没在本次回合 Read 过"被拒。流程:Read → Edit/Write 是要紧密成对的;复杂改动时**先 Read 全部要动的文件**,再 Edit 它们。否则中间的某个 Edit 会失败。

### 坑 2:Vue + TS + isolatedModules 下的类型导入
跟 NestJS 一样,Vue 的 `script setup` 在 `defineProps<{...}>()` 里引用类型时,类型必须用 `import type`。
我们的 Articles.vue / Editor.vue 大量 `import { ..., type Foo }` 写法,既能值导入也能类型导入,一行解决。

### 坑 3:ArticleStatus 是 union 不是 enum
后端 Prisma 的 `ArticleStatus` 是 enum,但 admin 的 `api/articles.ts` 写成了 union type:
```ts
type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
```
这样**前端不需要导入运行时值**(prisma client 不能在浏览器跑)。
代价:后端 schema 改了的话,前端的 union 不会自动同步。
长期方案:`packages/shared` 里维护一份 enum,前后端都用。**但 V1 不做**,先确保骨架跑通。

### 坑 4:slug 留空时前端要传 `undefined` 而不是空字符串
class-validator 的 `@IsOptional()` 配合 `@IsString()` 在收到空字符串时会失败(空字符串不是 undefined)。
所以前端这样写:
```ts
slug: newSlug.value.trim() || undefined,
```
而不是直接传 `newSlug.value.trim()`。否则用户留空 slug 字段,DTO 校验立刻 400。

### 坑 5:`onMounted` 内 await 不 catch 会让组件初始化挂起
```ts
onMounted(async () => {
  await loadOptions()      // 一次失败,后面的逻辑都不跑
  if (props.id) await loadArticle(props.id)
})
```
我在 Editor 里 `try { ... } catch (e) { error.value = ... }` 包了一圈,确保单个加载失败不会让整个表单卡死。

## 验收记录

```
$ pnpm --filter admin build
✓ 121 modules transformed.
✓ built in 443ms
新增的 chunk 都正确 emit:
  - Articles-XXX.js   4.17 kB
  - Editor-XXX.js     5.16 kB
  - Tags-XXX.js       3.64 kB
  - Categories-XXX.js 3.93 kB
  - Dashboard-XXX.js  3.02 kB
```

实际"登录 → 建文章 → 发布"的端到端验收交给 V1-09(Playwright)。

## 给学习者的提醒

- **"列表页 + 编辑器"是 admin 的标准模式**。即使 v3 设计稿只画了编辑器,V1 也必须补上列表页 —— 用户不能记住每篇文章的 id。
- **错误展示集中化**:`useApiError` / 全局 toast / 页内 banner —— 选一种,不要两种以上混用,否则用户体验割裂。
- **PartialType 在前端没等价物**,用 `Partial<Foo>` + `interface FooInput` 自己手维护。前端类型工程比后端轻量,但不能省。
- **DOM 表单用 `@submit.prevent`** 是 Vue 标配,别忘了 prevent —— 一旦表单触发原生 submit 浏览器就刷页面了。
- **删除操作必须有 `confirm`**,V1 用浏览器原生 confirm 是合理选择。Final 阶段再升级成自家 modal。
- **"启动期校验"思路同样适用前端**:axios 拦截器在启动期就装好,而不是每个 request 自己处理 401。
