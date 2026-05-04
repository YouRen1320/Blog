import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;
}
