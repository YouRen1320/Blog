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

export async function fetchProfile() {
  const { data } = await apiClient.get<AuthUser>('/users/me')
  return data
}
