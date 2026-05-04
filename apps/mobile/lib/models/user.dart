// 当前登录用户。NestJS 返回的 role 是 'ADMIN' | 'USER',这里用 enum 表达。

enum UserRole { admin, user }

UserRole _roleFrom(String s) {
  switch (s) {
    case 'ADMIN':
      return UserRole.admin;
    case 'USER':
    default:
      return UserRole.user;
  }
}

class AuthUser {
  final String id;
  final String username;
  final String email;
  final UserRole role;

  const AuthUser({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String,
      role: _roleFrom(json['role'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'email': email,
        'role': role == UserRole.admin ? 'ADMIN' : 'USER',
      };
}

class LoginResponse {
  final String accessToken;
  final AuthUser user;

  const LoginResponse({required this.accessToken, required this.user});

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['accessToken'] as String,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
