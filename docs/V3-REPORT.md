# V3 完成报告 —— Flutter 移动端

**日期**:2026-05-05
**Tag**:v0.3.0
**前置版本**:v0.1.0(V1 本地闭环)

## 范围

V3 把 `apps/mobile` 从 v3 design 静态 demo 升级成完整 mobile app:登录、文章浏览、草稿、AI 创作入口占位。

> **路线图调整**:用户决定先把所有功能(web/admin/mobile/AI)开发完毕,再做部署。原计划 V1→V2→V3 改为 V1→V3→V4→Final→V2。当前 V3 完成,下一步直接进 V4 AI。

## 完成清单

### 工程
- [x] 7 个核心依赖(riverpod / go_router / dio / secure_storage / shared_preferences / dotenv / markdown)
- [x] `.env` + `.env.example` 体系
- [x] `flutter analyze` 0 issue

### 数据层
- [x] User / Article / Tag / Category / Pagination 全部 model + fromJson
- [x] dio API client + 拦截器(token / 401)
- [x] AuthService / ArticlesService

### 状态管理
- [x] auth_provider(token + user 持久化到 secure_storage,启动时 hydrate)
- [x] articles_provider(FutureProvider 暴露 publicArticles / articleBySlug / drafts)

### UI
- [x] LoginPage(对接真实 /auth/login)
- [x] go_router + redirect 守卫
- [x] HomeShell 底部 3 tabs
- [x] ArticlesPage 公开文章列表(下拉刷新)
- [x] ArticleDetailPage(flutter_markdown 渲染正文)
- [x] DraftsPage admin 草稿列表
- [x] DraftEditorPage(新建草稿)
- [x] CreateRequestPage(AI 入口占位,V4 接 AI service)

### 文档
- [x] `docs/journal/V3-mobile.md` 综合 journal
- [x] 本报告

## V3 验证

**自动化层**:`flutter analyze` 全绿 + 编译通过(运行 `flutter build apk --debug` 可生成 debug APK)。

**手动层(需用户执行)**:
1. 起后端:`pnpm --filter api start:prod`(已 seed 过)
2. 起 admin:`pnpm --filter admin dev`(可选,移动端不依赖)
3. cd `apps/mobile && flutter run -d <device>`
4. 登录 `admin@iyouren.top / admin12345`
5. 验证:
   - ✅ 主页看到 seed 文章 "你好,博客"
   - ✅ 点进去 markdown 正文渲染正常
   - ✅ 切 ✎ tab 看到草稿(seed 里有 1 篇)
   - ✅ 点 + 新建草稿,admin 后台能看到
   - ✅ 切 ✦ AI tab 显示创作表单(按钮 toast "等 V4")

## 已知技术债 / V4 衔接点

- **iOS 编译**:需要 macOS + Xcode + Apple Developer 账号。我没法做。用户的 Mac 上 `cd apps/mobile/ios && pod install && open Runner.xcworkspace` 即可。
- **Android APK**:`flutter build apk --debug` 出在 `build/app/outputs/flutter-apk/app-debug.apk`,可装真机测试。
- **AI 创作按钮**:V4 时 onPressed 改成调 NestJS `POST /ai/generate/article`,响应直接落进草稿表。
- **语音输入**:V4 加 `speech_to_text` + 麦克风权限,转录文本灌进 prompt 输入框。
- **packages/shared 共享类型**:目前 mobile / admin / api 各自维护类型定义,改 schema 时要同步三处。Final 阶段接 build_runner / json_serializable + 共享 dart 包(也可让 mobile 直接消费 NestJS 的 OpenAPI / NSwag 出码)。

## 仓库变化

- 新增:`apps/mobile/lib/{models,services,providers,pages,utils}/*` 共 12 个 Dart 文件
- 新增:`apps/mobile/.env` + `.env.example`
- 改写:`apps/mobile/lib/main.dart`(from RootShell to ProviderScope+go_router)
- 删除:`apps/mobile/lib/screens/*`(老占位 demo)
- 修改:`apps/mobile/pubspec.yaml`(加 7 个依赖)

## 下一步:V4 AI 内容生产

V4 触达整个"AI 创作链":
- Python `apps/ai-service` FastAPI scaffold
- 接小米 MiMo(Claude API 兼容协议),做结构化输出
- NestJS `/ai/*` 端点把请求转发给 Python,落库为草稿
- Mobile create_request_page 真接通
- Admin 的 AIInbox 显示 AI 草稿

不停下,直接进 V4。
