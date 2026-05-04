// Youren Blog · Mobile (Flutter)
// 入口:
// 1. 装 .env(flutter_dotenv)
// 2. ProviderScope 包裹整个应用(Riverpod)
// 3. AuthGate 启动时 hydrate auth + 把 token getter 注入 dio
// 4. go_router 接管路由
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers/auth_provider.dart';
import 'router.dart';
import 'theme/tokens.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // .env 加载失败也不阻塞启动,fallback 到 const baseUrl
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {}
  runApp(const ProviderScope(child: YourenApp()));
}

class YourenApp extends ConsumerWidget {
  const YourenApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _AuthGate(builder: (router) {
      return MaterialApp.router(
        title: 'Youren · Mobile',
        debugShowCheckedModeBanner: false,
        theme: buildTheme(dark: false),
        darkTheme: buildTheme(dark: true),
        themeMode: ThemeMode.system,
        routerConfig: router,
      );
    });
  }
}

/// 启动时:
/// - 把 dio 的 token getter / 401 handler 接到 authProvider
/// - 调用 hydrate() 从 secure_storage 读上次的登录态
/// - 一切就绪后再构建 router(避免 redirect 在 ready=false 时误判)
class _AuthGate extends ConsumerStatefulWidget {
  final Widget Function(GoRouterFromBuilder router) builder;
  const _AuthGate({required this.builder});

  @override
  ConsumerState<_AuthGate> createState() => _AuthGateState();
}

typedef GoRouterFromBuilder = dynamic;

class _AuthGateState extends ConsumerState<_AuthGate> {
  late final dynamic _router;
  bool _wired = false;

  @override
  void initState() {
    super.initState();
    _wireUp();
  }

  void _wireUp() {
    final api = ref.read(apiClientProvider);
    api.installAuth(
      getToken: () => ref.read(authProvider).token,
      onUnauthorized: () => ref.read(authProvider.notifier).logout(),
    );
    ref.read(authProvider.notifier).hydrate();
    _router = buildRouter(ref);
    _wired = true;
  }

  @override
  Widget build(BuildContext context) {
    if (!_wired) return const SizedBox();
    return widget.builder(_router);
  }
}
