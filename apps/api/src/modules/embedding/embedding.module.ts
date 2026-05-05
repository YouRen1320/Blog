import { Global, Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';

// 标 Global,Articles + AiModule 都要用
@Global()
@Module({
  providers: [EmbeddingService],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
