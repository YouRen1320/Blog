import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  slug?: string;
}
