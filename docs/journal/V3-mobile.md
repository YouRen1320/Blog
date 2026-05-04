# V3 Flutter 移动端(整体)

**日期**:2026-05-05
**任务**:#18 ~ #23(V3-01 工程基建 → V3-06 创作入口占位)
**状态**:已完成

> 本篇是 V3 阶段的合并日志。V3 共 6 个任务,实现紧耦合(都是 Flutter 工程),拆 6 篇会反复重复同一套设计原理。学习者按顺序读这一篇就够了。

## 目标

把 `apps/mobile`(Flutter)从静态三标签 demo 升级成"能登录、能浏览、能创建草稿、为 AI 留好入口"的真实 app。

**验收**:
- `flutter analyze` 全绿
- 模拟器或真机能登录 admin → 看到 seed 文章 → 进详情 → 切到草稿 tab 看到 admin 草稿 → 切到创作 tab 看到 AI 入口占位

## 架构分层

```
lib/
├── main.dart                 入口,装 .env + ProviderScope + AuthGate
├── router.dart               go_router 配置 + redirect 守卫
├── theme/tokens.dart         (V0 已有)v3 设计系统色板 + AppType 字体工厂
├── utils/format.dart         法国共和历月份 / 阅读时长 / 短日期(与 web 对齐)
├── models/                   POJO + JSON
│   ├── user.dart             AuthUser + LoginResponse + UserRole enum
│   └── article.dart          ArticleSummary / ArticleDetail / PaginatedResponse<T>
├── services/                 业务接口
│   ├── api_client.dart       Dio 单例 + 拦截器(token / 401)
│   ├── auth_service.dart     login / fetchMe + AuthException
│   └── articles_service.dart 公开 + admin 文章接口
├── providers/                Riverpod 状态
│   ├── auth_provider.dart    secure_storage 持久化 + hydrate / login / logout
│   └── articles_provider.dart FutureProvider 暴露文章数据
└── pages/                    UI
    ├── login_page.dart       /login(v3 卡片设计)
    ├── home_shell.dart       底部 3 标签 + AppBar(用户名 + 登出)
    ├── articles_page.dart    /home 文章列表(下拉刷新)
    ├── article_detail_page.dart /article/:slug 详情(markdown)
    ├── drafts_page.dart      /drafts 草稿列表(ADMIN)
    ├── draft_editor_page.dart /draft/new /draft/:id
    └── create_request_page.dart /create AI 创作入口(占位)
```

## 关键决策

### 1. Riverpod,不是 Provider / GetX / BLoC

**已选**:flutter_riverpod 2.x
**理由**:
- Riverpod 是 Provider 同作者的"重写版",社区活跃度第一
- 全局编译期类型安全(StateNotifierProvider / FutureProvider 都强类型)
- 不依赖 BuildContext,可以在任意位置 ref.read,跟 dio 拦截器配合丝滑
- `ref.invalidate()` 一行触发刷新,不用手动管 stream

### 2. token 存 secure_storage,不存 SharedPreferences

**备选**:shared_preferences(easy)、secure_storage(KeyChain / Keystore)
**已选**:secure_storage

JWT 里有用户身份。手机 root / 越狱场景下 prefs 是明文磁盘。secure_storage 走系统钥匙串,即使设备 root 也要解密。**任何"会话级别"的 secret 都该用它**。SharedPreferences 留给主题、tab 默认页等无敏感信息。

### 3. dio 而不是裸 http 包

**备选**:`http`(官方,但极简陋)、`dio`(社区主流)
**已选**:dio

理由:
- 拦截器机制成熟(Authorization 头注入、401 兜底、retry)
- timeout / form-data / cancel 都内建
- 与 web 端的 axios 心智模型一致

### 4. flutter_dotenv 加载 .env,不是 String.fromEnvironment

**备选 A**:`String.fromEnvironment('API_BASE_URL')`(编译期注入)
**备选 B**:flutter_dotenv 运行时读 `.env` 资源 ✅

选 B 因为:
- 不同模拟器 / 真机用不同 API_BASE_URL,改 const 要重 build
- .env 当 asset 打包,运行时 dotenv.load 读取
- 跟根仓库的 `.env` 习惯一致

代价:.env 文件得是 asset,**不能含 secret**(打包就在 APK 里)。我们这里只有 API_BASE_URL,不敏感。AI key 之类 V4 的会通过 NestJS 中转,不直接打到 app 里。

### 5. go_router 而不是 Navigator 2.0 自己写

**已选**:go_router(官方推荐的高层封装)

理由:
- redirect 守卫一行写完(`if (!auth.isAuthenticated) return '/login'`)
- ShellRoute 模式跟 Web 路由 layout 同构
- deeplink 无痛(/article/:slug 自动支持)
- Navigator 2.0 RouterDelegate 写完一遍知道太复杂,生产用不上

### 6. AuthGate 在启动时 hydrate + 注入 dio

`main.dart` 的 `_AuthGate` 做三件事:
1. 把 dio 的 token getter / 401 handler 接到 authProvider
2. 调 `authProvider.notifier.hydrate()` 从 secure_storage 读 token
3. 一切就绪后才 build go_router

**为什么不在 ProviderScope 里直接构造 router?** —— 因为 router 的 redirect 在第一次跑时就会读 authProvider,如果 hydrate 还没完成,会把已登录用户错误跳到 /login。所以中间加个 splash 路由 + ready 标志。

### 7. 移动端不做 publish/delete

`draft_editor_page.dart` 只支持"新建"。已有草稿编辑也变只读。

理由:
- 移动端的核心定位是"快速记录创意"(发车上、跑步时灵感来了),不是"完整编辑"
- 复杂操作(改、发布、下线、删)在后台 admin 做,屏幕大、键盘好用
- 减少手机端的责任表面积,**降低 V3 工作量**和未来维护成本
- V4 的 AI 草稿天然进入相同的草稿池,审核流程统一

### 8. ArticleStatus / UserRole 用 enum 而不是 string

后端 Prisma 是 enum,Dart 这边也走 enum + 字符串解析:
```dart
enum ArticleStatus { draft, published, archived }
ArticleStatus _statusFrom(String s) { ... }
```

好处:switch case 编译期检查、类型推导链路清晰。坏处:每次后端加新状态要同步改两边。这个代价对于 5 张表的项目可接受。**未来 packages/shared 里维护一份 schema 描述,前后端 + Flutter 都生成出来**才是真解。

## 实际产出(对照 V3-01..06 任务清单)

| 任务 | 主要产出 |
|------|----------|
| V3-01 工程基建 | pubspec 加 7 个依赖 + .env / .env.example + flutter pub get |
| V3-02 API client + auth state | 5 个新文件:api_client / auth_service / articles_service / auth_provider / articles_provider + 2 个 model |
| V3-03 登录页 + 路由守卫 | login_page + home_shell + router.dart + 5 个占位 page + 重写 main.dart |
| V3-04 文章浏览 | articles_page(下拉刷新 + 卡片)+ article_detail_page(markdown 渲染) + utils/format.dart |
| V3-05 草稿管理 | drafts_page(列表 + FAB)+ draft_editor_page(新建只读编辑) |
| V3-06 创作入口 | create_request_page(prompt + tone + length + 麦克风占位) |

## 踩坑 / 注意

### 坑 1:isolatedModules 在 Dart 里没有,但 generated json 仍然存在
TypeScript 的 isolatedModules + emitDecoratorMetadata 麻烦在 Dart 里没有(Dart 没装饰器元数据)。但 JSON 解析仍然要写 `factory fromJson`。social cost 跟 freezed 比起来差不多,V3 阶段不引入 freezed/json_serializable code generation,因为类型不多 + 启动新工程时 build_runner 配置代价大。

### 坑 2:flutter_secure_storage 在 macOS 模拟器里有 entitlements 警告
首次启动时控制台会 warn "Group: ..., signing entitlements ...",可忽略。仅 macOS 平台有,iOS/Android 模拟器没事。如果要发 macOS desktop 版,得在 entitlements 里加 keychain access。**V3 不打 macOS 平台,无需处理**。

### 坑 3:redirect 守卫与 ready 标志的死锁
go_router 在启动时立刻调用 redirect。如果 authProvider.ready 还是 false 但 redirect 已经认为"未登录"跳 /login,然后 hydrate 完成 → 已登录,但 redirect 已经在 /login 上不会再触发。
**修法**:redirect 在 ready=false 时统一返回 `/splash`,等 hydrate 完成 + ProviderScope 通过 refreshListenable 触发重导航 → 走正常 redirect 把 splash 上的人带到 /home。

### 坑 4:flutter_markdown 没有 dark theme 自动反转
MarkdownStyleSheet 必须手动构造,把 p / h2 / blockquote / code 等都用 AppType + context.ink 显式指定,否则暗色主题下文字看不清。

### 坑 5:`.env` 是 asset 还是 secret
我们把 .env 当 asset 打包(pubspec.yaml `assets: - .env`)。这意味着:
- 它会出现在 APK / IPA 内部
- **千万不要把 secret 放进去**
- 当前只放 `API_BASE_URL` 是公开的 URL,无问题
- AI key 等 V4 引入时,**绝不写 mobile/.env**,而是通过 NestJS `/ai/*` 接口转发

### 坑 6:Android 模拟器要用 `10.0.2.2` 不是 `localhost`
模拟器内部的 localhost 指向自己。访问宿主机(Mac 上跑的 NestJS API)要走 10.0.2.2。iOS 模拟器走 localhost 没事。
**真机**:同 Wi-Fi 时改 `192.168.x.x` 你电脑的局域网 IP。生产用 https://www.iyouren.top。

## 验收记录

```
$ flutter pub get
+ 28 dependencies
1 package is discontinued.

$ flutter analyze
No issues found!

# 实机测试由用户执行(我无法启动模拟器):
# 1. cd apps/mobile && flutter run -d <device>
# 2. 在登录页输入 admin@iyouren.top / admin12345
# 3. 看到 /home 文章列表(应有"你好,博客")
# 4. 点进文章看到 markdown 渲染
# 5. 切 ✎ 标签看到草稿
# 6. 点 + 新建一个草稿 → 在 admin 后台应能看到
# 7. 切 ✦ 看 AI 创作页(全部按钮 toast"等 V4")
```

## V3 完成度

- ✅ Flutter 工程依赖完整
- ✅ 登录 / 路由守卫 / 持久化登录态
- ✅ 文章浏览(列表 + 详情 + markdown)
- ✅ 草稿浏览 + 提交(为 V4 AI 草稿审核打基础)
- ✅ AI 创作页 UI 骨架(等 V4 接通)
- ✅ flutter analyze 无 issue
- ⏸ 实机测试需用户跑(我没法操作物理设备 / 模拟器)
- ⏸ Android APK 构建留给 V3-07(实际打包步骤)
- ⏸ iOS 编译需用户的 Mac + Apple ID,V3-07 之后用户自己做

## 给学习者的提醒

- **Flutter 不是 Web,但很多模式可以平移**:Riverpod ≈ Pinia,go_router ≈ Vue Router,dio ≈ axios。架构层级一一对应。
- **secure_storage 不是 prefs**:任何"会话 + 身份"信息走 secure,其它走 prefs。
- **token 注入到 dio 用工厂函数**(getter pattern)而不是直接引 Riverpod provider,**避免循环依赖** —— 这条规则跟 admin (Vue) 端一样。
- **redirect + ready 标志**是 spa 通用模式:不要在还没准备好的状态下做"未登录就跳 login"的判断。
- **平台差异(IPv4/IPv6、Android/iOS、Emulator/真机)是 mobile 不可避免的复杂度**。做好分支兼容比追求"统一一行解决"更现实。
- **不要把 .env 当 secret 容器**。它会被打包,假装它是 secret 你会后悔。
