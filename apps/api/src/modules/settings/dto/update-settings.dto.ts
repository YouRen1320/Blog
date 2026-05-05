import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * 全部字段都 optional —— PATCH 语义,只更新提供的字段。
 * 数字字段加 min/max 防止前端传越界值;字符串加 maxLength 防爆。
 */
export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  aiModel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  aiThreshold?: number;

  @IsOptional()
  @IsBoolean()
  aiStreaming?: boolean;

  @IsOptional()
  @IsBoolean()
  aiRagRelated?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  jwtHours?: number;

  @IsOptional()
  @IsBoolean()
  requireMfa?: boolean;
}
