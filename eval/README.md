# eval/ —— Blog AI 服务质量评测

用 [promptfoo](https://www.promptfoo.dev) 跑端到端 eval:
**HTTP provider 直接打 ai-service `/generate/article`**,测整条 retrieve → rerank → generate 链路,不只是裸 LLM。

## 跑法

```bash
# 1. 起 ai-service(USE_MOCK_LLM=false,否则 mock 返固定数据 assertion 没意义)
cd apps/ai-service
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001

# 2. 在另一个终端,从仓库根
pnpm eval                # 命令行 summary
pnpm eval:view           # 浏览器看完整 HTML 报告

# 直接跑某一个 case 调试:
npx promptfoo eval -c eval/promptfooconfig.yaml --filter-tests '技术文'
```

## 当前 5 个 ground truth case

| # | 主题 | tone | length | 重点断言 |
|---|---|---|---|---|
| 1 | NestJS 模块化设计入门 | technical | medium | 含 NestJS / 模块 / `##` / 长度 > 600 |
| 2 | 深夜读书的体会 | casual | short | 含 夜 / 台灯 / 书 之一 |
| 3 | 秋天的最后一片叶子 | poetic | short | 含 秋 / 叶 |
| 4 | RAG 检索增强生成科普 | technical | long | 含 RAG / encoder / 长度 > 1500 |
| 5 | 博客的初心 | poetic | medium | **测 RAG 命中"第一灯"** —— 应引用风格 |

case 5 是最有意义的:它**故意写跟「第一灯」语义高度相关的 prompt**,如果 retrieve + rerank 工作正常,生成的草稿应该呼应第一灯的初心叙事。

## CI 集成(可选)

```bash
# GitHub Actions 步骤
- name: Run promptfoo eval
  run: pnpm eval
  env:
    XIAOMI_MIMO_API_KEY: ${{ secrets.MIMO_KEY }}
```

eval 失败会以非 0 退出码报错,可以把它接到 PR 检查里防 prompt regression。

## 加新 case

1. 编辑 `promptfooconfig.yaml`,在 `tests:` 下加一段
2. `vars.prompt` 是发给 ai-service 的输入;`assert` 可用类型:
   - `contains` / `contains-any` / `contains-all` —— 字符串
   - `javascript` —— 任意表达式,可访问 `output`(transformed string)和 `context`
   - `latency` —— 响应时长上限
   - `cost` —— token 成本上限
   - `llm-rubric` —— 用另一个 LLM 当 judge 打分(贵但准)
3. `pnpm eval` 重跑

## 升级路径

- 当前:5 个 case + 字符级 + 长度断言
- 短期:接 LLM-as-judge 评 tone 是否一致 / 结构是否清晰
- 中期:数据集化,跟版本对照(`promptfoo eval --output history/v1.4.json`)统计回归
