# apps/mobile —— Flutter 移动端

Flutter 3.35 + Riverpod + go_router + dio。轻量内容入口,主要做"语音/文本提交创作 → AI 生成草稿"链路。

**部署**:目前没有 App Store / Play Store 上架,本地 `flutter run` 调试 + 真机自构建 APK / iOS 自签。

---

## 默认登录账号(连生产或本地)

```
邮箱:admin@iyouren.top
密码:admin12345
```

API 地址通过 `apps/mobile/.env` 配置,**默认值是 Android 模拟器风格**:

```env
# .env 现值(本地 Android 模拟器访问宿主机 NestJS)
API_BASE_URL=http://10.0.2.2:3000
```

调试时根据目标设备调整:

| 设备 / 场景 | `API_BASE_URL` |
| --- | --- |
| Android 模拟器 | `http://10.0.2.2:3000` |
| iOS 模拟器 | `http://localhost:3000` |
| 真机(同 WiFi) | `http://<你电脑的 LAN IP>:3000` |
| 连生产 | `https://www.iyouren.top/api` |

---

## 页面结构

| 路由 | 用途 |
| --- | --- |
| `/login` | 登录页(JWT 持久化到 secure storage) |
| `/articles` | 文章列表(已发布) |
| `/articles/:id` | 文章详情(Markdown 渲染) |
| `/drafts` | AI 草稿列表(待审核) |
| `/create` | 创作入口:文本输入 / 语音输入(语音占位) |
| `/profile` | 当前用户信息 + 退出登录 |

---

## 技术栈

- **Flutter 3.35**(stable)
- **Riverpod 2** —— 状态管理(比 Provider 更可测,代码生成可选)
- **go_router** —— 声明式路由 + 守卫
- **dio** + **flutter_secure_storage** —— HTTP + token 持久化
- **flutter_markdown** —— 文章正文渲染

## 主要目录

```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── api/             # dio 封装 + token 拦截器
│   ├── router/          # go_router 配置
│   └── theme/
├── features/
│   ├── auth/            # 登录页 + auth provider
│   ├── articles/        # 文章列表 / 详情
│   ├── drafts/          # AI 草稿列表
│   └── create/          # 创作入口
└── shared/
    └── widgets/
```

## 本地开发

```bash
cd apps/mobile
flutter pub get
flutter run              # 选设备(模拟器或真机)
```

可用命令:

```bash
flutter analyze          # 静态检查(目前 No issues)
flutter test             # 单测(目前没写单测,test/ 目录空)
flutter build apk        # Android 调试 APK
flutter build ios        # iOS(需要 Mac + signing)
```

---

## 真机测试 checklist

我没真机,以下步骤等用户跑(在 V1.2-REPORT 也提到过):

```
□ flutter pub get && flutter run -d <device>
□ 登录页:输入 admin@iyouren.top + 密码 → 进入主界面
□ 草稿列表:看到 [MOCK] 草稿那条 + 第一灯 published
□ 点开第一灯 → 详情页正文 + 元信息正确显示
□ 新建草稿:输入 prompt → 提交 → ai-service 生成(15-30s)→ 草稿落库
□ 编辑草稿:改标题/正文 → 保存 → 列表反映
□ 退出登录 → 重新登录 OK
```

报错先检查 `.env` 里 `API_BASE_URL` 指向是否正确。

---

## 相关文档

- [`docs/V3-REPORT.md`](../../docs/V3-REPORT.md) — V3 移动端完成报告
- [`docs/journal/V3-mobile.md`](../../docs/journal/V3-mobile.md) — Riverpod 选型 + go_router 路由设计 + 踩坑
