import { IsEnum, IsOptional } from 'class-validator';
import { ArticleSource, ArticleStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ArticleQueryDto extends PaginationQueryDto {
  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus;

  @IsEnum(ArticleSource)
  @IsOptional()
  source?: ArticleSource;
}
