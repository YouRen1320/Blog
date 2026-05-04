import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUrl, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * 启动时校验 .env 是否齐全且类型对。
 * 缺值或类型错就在启动时直接抛错,避免到运行时才发现 DATABASE_URL 是 undefined。
 */
enum NodeEnv {
  development = 'development',
  production = 'production',
  test = 'test',
}

class EnvVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.development;

  @IsNumberString()
  @IsOptional()
  API_PORT: string = '3000';

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  AI_SERVICE_BASE_URL: string = 'http://127.0.0.1:8001';
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`环境变量校验失败:\n${errors.map((e) => e.toString()).join('\n')}`);
  }
  return validated;
}
