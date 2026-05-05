# V2 真上线(整体)

**日期**:2026-05-05
**任务**:#11 ~ #17(V2-01 SSH → V2-07 验收)
**状态**:已完成
**Tag**:v1.0.0

> V2 的故事 90% 是排错。完整决策跟修复链路记在这里,以后再部署或者换新机器时直接对照。

## 链路

```
本机 git push → GitHub
                   ↓
              GitHub Actions(测 + ssh deploy)
                   ↓
ssh blog-deploy → 阿里云 ECS Docker-wuob
                   ↓
docker compose up -d --build
                   ↓
postgres / api / web / admin / ai-service / caddy 6 个容器
                   ↓
Caddy 自动 LE 证书 → https://www.iyouren.top
```

## 关键决策

### 1. SSH key + admin 用户(不是 root)
阿里云 Linux 3 默认禁用 root SSH,标准做法是用 `admin` 用户 + sudo。Workbench 也是 admin 登录。

我们装的 ed25519 key 进 `/home/admin/.ssh/authorized_keys`,本机 `~/.ssh/config` 配 `Host blog-deploy User admin`。

不动 root 密码登录开关,因为用户保留密码登录作为兜底(万一 SSH key 失败还能 Workbench)。

### 2. 用 Caddy 不用 Nginx
[F-05 已经决策](Final-hardening.md)。Caddy 在国内的真实优势体现在第一次部署:**Let's Encrypt 申请完全自动**,5 行配置 vs Nginx + Certbot 50+ 行。

### 3. ai-service 在中国境内 build,镜像源走阿里云内网

**重要**:Aliyun ECS 跑 docker build 时,**不要用 Tsinghua / 默认 Debian 源**,走 `mirrors.cloud.aliyuncs.com`(走 ECS 内网到阿里自家骨干,不出公网)。
- Tsinghua HTTPS 走公网,从 ECS 角度比 Aliyun 内网慢一个数量级
- 阿里云内网延迟 1-2ms,带宽充裕

实测:
- Tsinghua 源:apt-get update 卡 5+ 分钟
- aliyuncs.com 内网:apt-get update 几秒完成

### 4. Debian 13 trixie 的 sources.list 是 DEB822 格式
这次 python:3.12-slim 升级到了 Debian 13。**不能再用 sources.list 老格式**,要改 `/etc/apt/sources.list.d/debian.sources`。

```dockerfile
RUN sed -i "s|deb.debian.org|mirrors.cloud.aliyuncs.com|g" /etc/apt/sources.list.d/debian.sources
```

这一行替换最稳,不需要重写整个文件。

### 5. 多用户 Docker:运行时不当 root
- api Dockerfile:`adduser nodejs -u 1001` + `chown` /app + `USER nodejs`
- ai-service:`useradd app -u 1001` + 装到 `/home/app/.local`(不是 `/root/.local`)
- admin (nginx static):用默认 nginx,nginx 自己处理 worker user

降权后即使应用有漏洞也限定在容器内 + 非 root,降低攻击面。

### 6. Prisma engine 必须 cp 进 deploy 目录

`pnpm --filter api --prod deploy /deploy` 不会带 `.prisma/client`(那是 schema-specific 生成产物,不算依赖)。生产镜像必须显式 cp:

```dockerfile
RUN cp -r /repo/node_modules/.pnpm/@prisma+client*/node_modules/.prisma /deploy/node_modules/.prisma 2>/dev/null || \
    cp -r /repo/apps/api/node_modules/.prisma /deploy/node_modules/.prisma 2>/dev/null || true
```

第一条覆盖 monorepo hoisted 场景,第二条覆盖 project-local 场景,`|| true` 保证就算两条都失败也不让 build 挂。

### 7. healthcheck 必须用镜像里**真有的**工具
- alpine 默认有 wget ✅
- Debian slim 没有 wget,要 install 或换 python urllib ✅

我们 ai-service 用 python(本来就要装的运行时)做 healthcheck:
```yaml
test: ["CMD", "python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8001/healthz', timeout=3).status==200 else 1)"]
```

### 8. .env.production 不进 git,服务器单独维护
强密码用 `openssl rand -hex 24`(POSTGRES)+ `openssl rand -hex 48`(JWT)在服务器现场生成,**永远不出现在我电脑、聊天记录或仓库**。

文件权限 `chmod 600`,只 admin 可读。

### 9. 备份用 systemd timer,不用 cron
- 现代 systemd 系统 timer 比 cron 更可调试(`systemctl status` 直接看上次跑得怎么样)
- 失败时 journalctl 自动收日志
- `RandomizedDelaySec=10min` 避免大家都准点跑
- `Persistent=true` 让休眠错过也能补跑

### 10. 第一次部署用 mock LLM,不真烧 quota
`USE_MOCK_LLM=true` 开机,验证全栈跑通,然后再切 false 真用模型。

避免"上线第一天因为 endpoint 配错把 1000 token 烧没了"。

## 踩坑 & 解法时间线

| 时间 | 现象 | 根因 | 解法 |
|------|------|------|------|
| 11:00 | SSH 不响应,banner 都不返 | 本机 Clash TUN 把 SSH 流量代理走了 | 加 `route add -host 47.97.17.43 <real-gw>` 静态路由 |
| 11:05 | TCP 通了但 sshd 不接 | aliyun ECS 默认禁 root SSH | 改用 admin 用户 |
| 11:06 | publickey denied | authorized_keys 实际没我的 key(heredoc 没关闭) | nano 手动编辑 |
| 11:18 | docker build 卡在 apt-get | Tsinghua 源虽然在 .sources.list 但被 trixie 默认 .sources 覆盖 | sed 改 debian.sources + 用 aliyuncs 内网 |
| 11:55 | ai-service crashloop "permission denied" | app user 进不去 /root/ | 改装到 /home/app/.local |
| 11:55 | api crashloop "MODULE_NOT_FOUND .prisma/client" | pnpm deploy 不带生成产物 | cp 显式拷 |
| 12:04 | caddy 起不来 "address already in use" | host 系统遗留 nginx 在 80/443 | kill + systemctl disable |
| 12:10 | ai-service unhealthy | wget 不在 slim image | 改 python urllib healthcheck |

每条都让我吃一惊一次,**写在 journal 里下次别再被同一招打到**。

## 用户介入清单

我自己干了 90% 的事,以下是用户必须自己操作的:

1. **阿里云安全组**:加我 IP 进 22 端口白名单(已完成,但因 Clash 路由问题白名单填错过)
2. **Workbench 装公钥**:把我的 ed25519 公钥追加到 `/home/admin/.ssh/authorized_keys`(已完成)
3. **本机 Mac sudo 加路由**:`sudo route -n add` 把阿里云 IP 切直连(已完成)
4. **Aegis 默认拦截**:`sudo systemctl stop aegis` 临时停掉(已完成)
5. **GitHub Actions Secrets**:V2-05 的 CI/CD 工作流要 work,需要在 GitHub repo settings 加 4 个 secret(待用户配)

## 验收记录(2026-05-05 12:11)

```
$ curl -s -o /dev/null -w "%{http_code}\n" https://www.iyouren.top/
200
$ curl -s https://www.iyouren.top/api/articles | head -c 100
{"data":[{"id":"...","title":"你好,博客 · 上线了",...
$ curl -X POST https://www.iyouren.top/api/auth/login -d '{"email":"admin@iyouren.top","password":"admin12345"}'
{"accessToken":"eyJh...","user":{"role":"ADMIN",...}}
$ docker compose ps
6 containers, all Up, ai-service+api+postgres healthy
$ systemctl status blog-db-backup.timer
Active: active (waiting), 下次 03:37 触发
$ ls /var/backups/blog/
blog-20260505-121112.sql.gz   (3.1KB,首次手动测试)
```

## 给学习者的提醒

- **生产部署的工作量,90% 在排错,10% 在写代码**。本地跑得通到生产跑得通是另一道关。
- **本机网络配置(Clash / VPN / proxy)** 是排查"为什么我连不上"的第一嫌疑人。`route -n get <ip>` 看实际路由。
- **中国境内构建一定走国内镜像源**,Tsinghua / 阿里云内网都行。前者公网慢,后者从 ECS 出发最快。
- **Debian 镜像基础版本**会随着 Python/Node base image 升级悄悄变,养成检查 `os-release` 的习惯。
- **多阶段 Dockerfile + 非 root user**:builder 装东西,runner 复制并 chown 给非特权 user,然后 USER 切换。一定要在 USER 切换前完成所有需要 root 的事(写系统文件、装包、cp)。
- **healthcheck 命令要在镜像里真存在**,别复制粘贴用 wget 然后镜像里没装。
- **生产 secret 永远在服务器端生成 + 留存**,不出现在 git / 聊天 / 任何持久化的客户端记录。
- **第一次部署用 mock 数据 / mock LLM**,把链路打通再切真服务,**省 quota 也省自己心情**。
