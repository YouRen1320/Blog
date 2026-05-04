// Dio 单例 + 拦截器。
// - baseURL 来自 .env 的 API_BASE_URL
// - 请求拦截器:从 secure_storage 读 token 注入 Authorization
// - 响应拦截器:401 时清登录态(由 auth_provider 监听)
//
// 拦截器之所以注入"读 token 的回调"而不是直接引 provider,是因为
// dio 实例本身要在 provider 初始化之前就能用(同 web 端思路)。

import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiClient {
  late final Dio _dio;
  String? Function()? _tokenGetter;
  void Function()? _onUnauthorized;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
      // 不抛异常的状态码段:让我们自己在 catchError 里处理 4xx
      validateStatus: (s) => s != null && s < 500,
    ));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = _tokenGetter?.call();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onResponse: (response, handler) {
        if (response.statusCode == 401) {
          _onUnauthorized?.call();
        }
        handler.next(response);
      },
    ));
  }

  Dio get dio => _dio;

  /// 由 auth_provider 在初始化时调用,把 token 来源注入 dio。
  void installAuth({
    required String? Function() getToken,
    required void Function() onUnauthorized,
  }) {
    _tokenGetter = getToken;
    _onUnauthorized = onUnauthorized;
  }
}
