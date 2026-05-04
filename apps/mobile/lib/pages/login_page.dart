// 登录页 —— v3 design 风格,与 web/admin 同源:
// 卡片居中、斜体 Y logo、mono 上标、衬线标题。
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';
import '../theme/tokens.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _email = TextEditingController(text: 'admin@iyouren.top');
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).login(_email.text.trim(), _password.text);
      // 登录成功:go_router 的 redirect 会自动把我们送到 /home
      if (mounted) context.go('/home');
    } on AuthException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = '登录失败,请稍后再试');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 360),
            padding: const EdgeInsets.all(36),
            decoration: BoxDecoration(
              color: context.card,
              borderRadius: BorderRadius.circular(18),
              boxShadow: v3Shadow,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Text(
                    'Y',
                    style: AppType.disp(
                      fontSize: 36,
                      color: context.accent,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    '欢迎回来',
                    style: AppType.cn(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: context.ink,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Center(
                  child: Text(
                    '使用管理员账号登入',
                    style: AppType.cn(fontSize: 12, color: context.ink3),
                  ),
                ),
                const SizedBox(height: 28),
                _label(context, 'EMAIL'),
                _field(context, _email, false),
                const SizedBox(height: 14),
                _label(context, 'PASSWORD'),
                _field(context, _password, true),
                if (_error != null) ...[
                  const SizedBox(height: 14),
                  Text(_error!, textAlign: TextAlign.center, style: AppType.sans(fontSize: 12, color: const Color(0xFFC0392B))),
                ],
                const SizedBox(height: 22),
                ElevatedButton(
                  onPressed: _busy ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.ink,
                    foregroundColor: context.bg,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Text(_busy ? '登入中…' : '登入 →', style: AppType.sans(fontSize: 13, fontWeight: FontWeight.w500)),
                ),
                const SizedBox(height: 14),
                Center(
                  child: Text('JWT · BEARER', style: AppType.mono(fontSize: 10, color: context.ink3)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _label(BuildContext c, String text) => Text(
        text,
        style: AppType.mono(fontSize: 10, color: c.ink3, letterSpacing: 1.5),
      );

  Widget _field(BuildContext c, TextEditingController ctrl, bool obscure) => TextField(
        controller: ctrl,
        obscureText: obscure,
        keyboardType: obscure ? TextInputType.visiblePassword : TextInputType.emailAddress,
        autocorrect: false,
        enableSuggestions: !obscure,
        style: AppType.sans(fontSize: 13, color: c.ink),
        decoration: InputDecoration(
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          filled: true,
          fillColor: c.bg,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: c.rule),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: c.rule),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: c.accent),
          ),
        ),
      );
}
