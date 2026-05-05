// 调用后端的 /admin/ai/drafts(NestJS 中转,不直接打 ai-service)。
import 'package:dio/dio.dart';
import '../models/article.dart';
import 'api_client.dart';

class AiService {
  final ApiClient _client;
  AiService(this._client);

  Future<ArticleDetail> generateDraft({
    required String prompt,
    String tone = 'technical',
    String length = 'medium',
  }) async {
    try {
      final res = await _client.dio.post(
        '/admin/ai/drafts',
        data: {
          'prompt': prompt,
          'tone': tone,
          'length': length,
        },
        options: Options(
          // AI 生成可能慢,把超时拉长
          sendTimeout: const Duration(seconds: 60),
          receiveTimeout: const Duration(seconds: 90),
        ),
      );
      if (res.statusCode == null || res.statusCode! >= 400) {
        final body = res.data;
        String msg = 'AI 生成失败';
        if (body is Map<String, dynamic>) {
          final m = body['message'];
          if (m is String) msg = m;
          if (m is List) msg = m.join('; ');
        }
        throw Exception(msg);
      }
      return ArticleDetail.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.message ?? '网络错误');
    }
  }

  /// 上传 audio 文件,返回转写文字。
  /// 后端 POST /admin/ai/transcribe(multipart/form-data,字段 file)。
  /// 后端没配 WHISPER_API_KEY 时返 503,这里抛 Exception("语音转写未配置")。
  Future<String> transcribe(String filePath, {String mimeType = 'audio/m4a'}) async {
    try {
      final form = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: 'voice.m4a'),
      });
      final res = await _client.dio.post(
        '/admin/ai/transcribe',
        data: form,
        options: Options(
          sendTimeout: const Duration(seconds: 60),
          receiveTimeout: const Duration(seconds: 60),
        ),
      );
      final data = res.data;
      if (data is Map<String, dynamic> && data['text'] is String) {
        return data['text'] as String;
      }
      throw Exception('转写响应格式异常');
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response?.data['message']?.toString() ?? e.message ?? '网络错误')
          : (e.message ?? '网络错误');
      throw Exception(msg);
    }
  }
}
