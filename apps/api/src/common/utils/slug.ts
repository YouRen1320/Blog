import slugify from 'slugify';

/**
 * 生成 URL-safe slug。
 *
 * - 中文 → 拼音不做(slugify 自带的中文支持有限);中文 title 必须显式提供 slug
 * - 同名时由调用方自己加后缀(-2、-3...);本函数只做"格式转换"
 */
export function makeSlug(input: string): string {
  return slugify(input, {
    lower: true,
    strict: true, // 去掉非字母数字字符
    trim: true,
  });
}
