# V2 完成报告 —— 真上线 https://www.iyouren.top

**日期**:2026-05-05
**Tag**:v1.0.0
**前置版本**:v0.5.0(Final 生产化)

## 范围

把本地 5 个版本(V1+V3+V4+Final)开发完整的全栈博客部署到阿里云 ECS Docker-wuob,域名 https://www.iyouren.top 公网可访问。

## 完成清单

- [x] **V2-01 SSH 接入**:本机 ed25519 key + Workbench 安装公钥到 admin 用户
- [x] **V2-02 服务器基础**:清掉旧容器(game-web, official-website)+ 装 docker / git / 创建 /opt/blog
- [x] **V2-03 生产 compose**:在 F-05 已写好,同步到服务器
- [x] **V2-04 首次部署**:`docker compose up -d --build` 起 6 个容器(api / web / admin / ai-service / postgres / caddy)
- [x] **V2-05 CI/CD workflow**:`.github/workflows/deploy.yml` 已 push,等用户配 GitHub Secrets 后自动触发
- [x] **V2-06 备份 + 健康检查**:systemd timer `blog-db-backup.timer` 每日 03:30 备份(留 7 天)+ 所有容器有 healthcheck
- [x] **V2-07 验收 + tag v1.0.0**:本文档

## 现在的生产架构

```
用户浏览器 / 移动端
    ↓
阿里云 ECS 47.97.17.43
    ├── Caddy(80/443) 自动 LE 证书
    │     ├── www.iyouren.top + iyouren.top → web (Nuxt SSR :3000)
    │     ├── www.iyouren.top/api/* → api (NestJS :3000) ← 反代 strip /api
    │     └── admin.iyouren.top → admin (nginx + Vue SPA :80)
    ├── api → ai-service (FastAPI :8001) → 小米 MiMo
    └── api → postgres (postgres:16-alpine)

systemd timer:每日 03:30 → /opt/blog/scripts/db-backup.sh → /var/backups/blog/
```

## 公网验证

```
$ curl -s https://www.iyouren.top/api/articles | head -c 200
{"data":[{"id":"...","title":"你好,博客 · 上线了","slug":"hello-blog",...}]}

$ curl -X POST https://www.iyouren.top/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@iyouren.top","password":"admin12345"}'
→ accessToken + user.role=ADMIN

$ docker compose ps
NAME                STATUS                    PORTS
blog-admin-1        Up 14 min                 80/tcp
blog-ai-service-1   Up 25s (healthy)          8001/tcp
blog-api-1          Up 8 min (healthy)        3000/tcp
blog-caddy-1        Up 6 min                  0.0.0.0:80, 0.0.0.0:443
blog-postgres-1     Up 14 min (healthy)       5432/tcp
blog-web-1          Up 7 min                  3000/tcp
```

## 部署期踩到的坑(详见 docs/journal/V2-deploy.md)

1. **本机 Clash TUN 模式**劫持所有 TCP,SSH 走代理出去阿里云不知道我是谁 → `sudo route -n add` 静态路由直连
2. **阿里云 ECS Linux 默认禁 root SSH**,正确用户是 admin → SSH key 装到 `/home/admin/.ssh/authorized_keys`
3. **Aliyun Aegis 主机防御**默认拦境外 IP → 加白名单(用户操作)
4. **paste 长 SSH 公钥被 Workbench 终端截断** → 用 `tee -a` + Ctrl+D 手动输入,或 `nano` 编辑
5. **服务器 git pull GitHub 超时**(中国到 GitHub 不稳)→ 关键修改用 `scp` 推过去
6. **Python image base 是 Debian 13 trixie**(不是 bookworm),sources.list 旧格式不生效 → 改用 sed 替换 `/etc/apt/sources.list.d/debian.sources`
7. **境内 pip / apt 走 Tsinghua HTTPS 也慢** → 改成阿里云 ECS 内网 `mirrors.cloud.aliyuncs.com`(走骨干网)
8. **ai-service 用 app user(uid 1001)** 但依赖在 `/root/.local/`,user 进不去 root 目录 → 改成 `/home/app/.local`
9. **api 镜像 pnpm deploy 不带 `.prisma/client`** → Dockerfile 加 `cp` 命令显式拷过去
10. **prisma 6.19 用 `prisma db seed` 需要 package.json 的 `prisma.seed` 字段**,但 deploy 后 package.json 缺失 → 用 psql 直接 INSERT
11. **服务器 80/443 被旧 host nginx 占着**(systemd 显示 failed 但 worker 还活着)→ kill 所有 nginx 进程 + `systemctl disable`
12. **wget 不在 python:3.12-slim** → ai-service healthcheck 改用 python urllib

## 还没接的(用户自己操作)

### GitHub Actions Secrets(让 push main 自动部署)
GitHub repo settings → Secrets and variables → Actions → New repository secret:

- `SSH_PRIVATE_KEY` → 内容是 `~/.ssh/blog-deploy` 这个文件(不是 .pub 那个,是私钥本身)
- `SERVER_HOST` → `47.97.17.43`
- `SERVER_USER` → `admin`
- `SERVER_DEPLOY_DIR` → `/opt/blog`

配完后 push main 触发 `.github/workflows/deploy.yml` 自动跑测 + SSH 部署。

### DNS 配置(已经成功因为 Caddy 已经签到证书,但记录一下)
确认你阿里云 DNS 控制台里:
- `www.iyouren.top` A → 47.97.17.43
- `iyouren.top` A → 47.97.17.43(裸域,Caddy 会 301 到 www)
- 可选:`admin.iyouren.top` A → 47.97.17.43(后台子域,Caddy 已配置)

### 切真 LLM(把 USE_MOCK_LLM=false)
`/opt/blog/.env.production` 里:
```
USE_MOCK_LLM=false
XIAOMI_MIMO_BASE_URL=<在小米 MiMo 控制台确认真实 endpoint>
```
然后 `cd /opt/blog && sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d ai-service`

测试:在 admin 后台 /inbox 输入 prompt → 看 AI 草稿是不是真生成了。

### 安全加固(可选)
1. 关掉密码 SSH:`/etc/ssh/sshd_config` 改 `PasswordAuthentication no` + `sudo systemctl restart sshd`(我装好 key 了,你也能用 Workbench 兜底)
2. 阿里云安全组:22 改成只放行你家 IP 段 + GitHub Actions IP 段
3. 关掉 docker daemon 的网络元数据访问:limit `100.100.x.x` 出口

## 现在你可以做什么

- 浏览 https://www.iyouren.top → 看到"你好,博客 · 上线了"
- 后台:登录 admin@iyouren.top / admin12345 → 写文章 → 发布 → 网站秒级出现
- 移动端:手机上 build APK,API base 改成 https://www.iyouren.top/api
- AI 草稿:V4 流程已通,等你切真 LLM 后用 prompt 生成

## V0 → V1.0 总览

| Tag | 阶段 | 主要交付 |
|-----|------|----------|
| v0.1.0 | V1 | 后端 + 后台 + 网站本地闭环 |
| v0.3.0 | V3 | Flutter 移动端 |
| v0.4.0 | V4 | AI 内容生产链路 |
| v0.5.0 | Final | 限流/日志/Docker 加固 |
| **v1.0.0** | **V2 上线** | **生产部署到阿里云 ECS** |

50+ 个测试 / 5 个应用 / 1 个 Python 微服务 / 跨 3 种语言(TS / Dart / Python) / Docker 编排 / 自动 HTTPS / 每日备份。

**vibe coding 项目从零到上线完成**。
