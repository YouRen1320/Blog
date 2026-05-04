// Riverpod 状态:登录态 + 当前用户。
// 启动时主动从 secure_storage 水合 token,避免重启 app 后被路由守卫误判。
//
// API client 在 main.dart 启动时 install 这个 provider 的 token getter 和 401 handler。

import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';

const _tokenKey = 'blog_mobile_token';
const _userKey = 'blog_mobile_user';

class AuthState {
  final String? token;
  final AuthUser? user;
  final bool ready; // 启动时水合是否完成

  const AuthState({this.token, this.user, this.ready = false});

  bool get isAuthenticated => token != null && user != null;

  AuthState copyWith({String? token, AuthUser? user, bool? ready, bool clear = false}) {
    if (clear) return const AuthState(token: null, user: null, ready: true);
    return AuthState(
      token: token ?? this.token,
      user: user ?? this.user,
      ready: ready ?? this.ready,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final FlutterSecureStorage _storage;

  AuthNotifier(this._authService, this._storage) : super(const AuthState());

  /// 从 secure storage 读 token + user,在 main 启动时调一次。
  Future<void> hydrate() async {
    final token = await _storage.read(key: _tokenKey);
    final userRaw = await _storage.read(key: _userKey);
    if (token != null && userRaw != null) {
      try {
        final user = AuthUser.fromJson(jsonDecode(userRaw) as Map<String, dynamic>);
        state = AuthState(token: token, user: user, ready: true);
        return;
      } catch (_) {
        // 损坏的存储,清掉
        await _storage.delete(key: _tokenKey);
        await _storage.delete(key: _userKey);
      }
    }
    state = const AuthState(token: null, user: null, ready: true);
  }

  Future<void> login(String email, String password) async {
    final res = await _authService.login(email, password);
    await _storage.write(key: _tokenKey, value: res.accessToken);
    await _storage.write(key: _userKey, value: jsonEncode(res.user.toJson()));
    state = AuthState(token: res.accessToken, user: res.user, ready: true);
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
    state = state.copyWith(clear: true);
  }
}

// ── Providers ──────────────────────────────────────────

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(),
);

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authServiceProvider = Provider<AuthService>(
  (ref) => AuthService(ref.watch(apiClientProvider)),
);

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(authServiceProvider),
    ref.watch(secureStorageProvider),
  );
});
