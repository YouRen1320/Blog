import { IsArray, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  summary?: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  cover?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];
}
