import 'package:dio/dio.dart';
import '../models/user.dart';
import 'api_client.dart';

/// 登录 / 当前用户接口。返回的异常用 [AuthException] 包装,
/// 上层只需要把 message 显示给用户。
class AuthException implements Exception {
  final String message;
  final int? statusCode;
  const AuthException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class AuthService {
  final ApiClient _client;
  AuthService(this._client);

  Future<LoginResponse> login(String email, String password) async {
    try {
      final res = await _client.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      if (res.statusCode != 200) {
        throw _toAuthError(res);
      }
      return LoginResponse.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw AuthException(e.message ?? '网络错误', statusCode: e.response?.statusCode);
    }
  }

  Future<AuthUser> fetchMe() async {
    final res = await _client.dio.get('/users/me');
    if (res.statusCode != 200) {
      throw _toAuthError(res);
    }
    return AuthUser.fromJson(res.data as Map<String, dynamic>);
  }

  AuthException _toAuthError(Response res) {
    final body = res.data;
    String msg = '登录失败';
    if (body is Map<String, dynamic>) {
      final m = body['message'];
      if (m is String) msg = m;
      if (m is List) msg = m.join('; ');
    }
    return AuthException(msg, statusCode: res.statusCode);
  }
}
