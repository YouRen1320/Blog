import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  postHello(): any {
    return [
      {
        id: 1,
        name: '第一篇文章',
        description: '这是2026年3月16日发表的第一篇测试文章',
      },
      {
        id: 2,
        name: '这是第二篇测试文章',
        description: '这是2026年3月16日发表的第二篇测试文章',
      },
    ];
  }
}
