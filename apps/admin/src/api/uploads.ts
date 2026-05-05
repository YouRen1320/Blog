import { apiClient } from './client'

export interface UploadResult {
  url: string
  filename: string
  size: number
  mimetype: string
}

/**
 * 上传一张图片到后端。返回相对 URL(`/uploads/<hash>.ext`),
 * web 端用 `<NUXT_PUBLIC_SITE_URL>/uploads/...` 访问。
 *
 * 限制(后端校验):mime 必须是 jpeg/png/webp/gif/avif,大小 ≤ 8MB。
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<UploadResult>('/admin/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
