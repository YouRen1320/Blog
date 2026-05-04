import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/ai_service.dart';
import 'auth_provider.dart';

final aiServiceProvider = Provider<AiService>(
  (ref) => AiService(ref.watch(apiClientProvider)),
);
