// 登录后的主壳:
// - AppBar:用户名 + 登出
// - 底部 3 标签:Browse / Create / Drafts
// 子路由 child 由 ShellRoute 注入。
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../theme/tokens.dart';

class HomeShell extends ConsumerWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final loc = GoRouterState.of(context).matchedLocation;
    final tabIndex = switch (loc) {
      '/create' => 1,
      '/drafts' => 2,
      _ => 0,
    };
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        backgroundColor: context.bg,
        elevation: 0,
        title: Text(
          'YouRen · ${user?.username ?? ''}',
          style: AppType.cn(fontSize: 14, color: context.ink, fontWeight: FontWeight.w500),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.logout, color: context.ink3, size: 20),
            tooltip: '退出登录',
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      body: child,
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: Container(
            decoration: BoxDecoration(
              color: context.card,
              borderRadius: BorderRadius.circular(999),
              boxShadow: v3Shadow,
            ),
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              children: [
                _tab(context, '◉', 0, tabIndex, () => context.go('/home')),
                _tab(context, '✦', 1, tabIndex, () => context.go('/create')),
                _tab(context, '✎', 2, tabIndex, () => context.go('/drafts')),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _tab(BuildContext c, String glyph, int idx, int active, VoidCallback onTap) {
    final on = idx == active;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Center(
          child: Text(glyph, style: TextStyle(fontSize: 16, color: on ? c.accent : c.ink3)),
        ),
      ),
    );
  }
}
