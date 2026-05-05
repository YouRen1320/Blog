import { apiClient } from './client'

export interface AuthUser {
  id: string
  username: string
  email: string
  role: 'ADMIN' | 'USER'
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export async function loginRequest(email: string, password: string) {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password })
  return data
}

/**
 * 公开注册 —— 永远创建 USER role,创建后自动签 token,直接登录态。
 * 后端 strict 限流 5/min。
 */
export async function registerRequest(username: string, email: string, password: string) {
  const { data } = await apiClient.post<LoginResponse>('/auth/register', {
    username,
    email,
    password,
  })
  return data
}

export async function fetchProfile() {
  const { data } = await apiClient.get<AuthUser>('/users/me')
  return data
}

/**
 * 改密码。
 * 后端 PATCH /auth/password,strict 限流 5/min,需要当前 token。
 * 失败时(401 / 400)抛 axios error,UI 层 catch 显示。
 */
export async function changePasswordRequest(currentPassword: string, newPassword: string) {
  const { data } = await apiClient.patch<{ ok: true }>('/auth/password', {
    currentPassword,
    newPassword,
  })
  return data
}
