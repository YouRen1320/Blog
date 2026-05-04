// go_router 配置 + 登录守卫。
//
// 设计:
// - /login         未登录可访问,已登录跳 /home
// - /home          浏览(默认)
// - /article/:slug 文章详情
// - /drafts        草稿列表(admin)
// - /create        AI 创作入口
//
// redirect 在每次导航前跑,根据 authProvider 状态决定放行/跳转。
// 启动期 auth.ready 为 false 时让所有路由停在一个简单 splash。

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'pages/article_detail_page.dart';
import 'pages/articles_page.dart';
import 'pages/create_request_page.dart';
import 'pages/draft_editor_page.dart';
import 'pages/drafts_page.dart';
import 'pages/home_shell.dart';
import 'pages/login_page.dart';
import 'providers/auth_provider.dart';
import 'theme/tokens.dart';

/// 启动期 splash:auth 还没 hydrate 时显示,避免被 redirect 误判。
class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: context.bg,
        body: Center(
          child: Text('Y', style: AppType.disp(fontSize: 48, color: context.accent)),
        ),
      );
}

GoRouter buildRouter(WidgetRef ref) {
  return GoRouter(
    initialLocation: '/home',
    refreshListenable: _AuthListenable(ref),
    redirect: (ctx, state) {
      final auth = ref.read(authProvider);
      if (!auth.ready) return '/splash';
      final atLogin = state.matchedLocation == '/login';
      final atSplash = state.matchedLocation == '/splash';
      if (!auth.isAuthenticated) {
        return atLogin ? null : '/login';
      }
      // 已登录但还在 login/splash → 进 home
      if (atLogin || atSplash) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const _Splash()),
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      ShellRoute(
        builder: (_, __, child) => HomeShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const ArticlesPage()),
          GoRoute(path: '/drafts', builder: (_, __) => const DraftsPage()),
          GoRoute(path: '/create', builder: (_, __) => const CreateRequestPage()),
        ],
      ),
      GoRoute(path: '/article/:slug', builder: (_, s) => ArticleDetailPage(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/draft/new', builder: (_, __) => const DraftEditorPage()),
      GoRoute(path: '/draft/:id', builder: (_, s) => DraftEditorPage(id: s.pathParameters['id'])),
    ],
  );
}

/// 把 Riverpod 的状态变化暴露给 go_router 的 refreshListenable。
class _AuthListenable extends ChangeNotifier {
  _AuthListenable(WidgetRef ref) {
    ref.listen<AuthState>(authProvider, (_, __) => notifyListeners());
  }
}
