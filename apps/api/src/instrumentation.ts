/**
 * OpenTelemetry 全栈追踪 —— 必须在任何业务代码 import 之前 import。
 *
 * 启用方式(都不设就完全不工作,SDK 不创建 provider,无任何性能影响):
 *   OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
 *   OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=xxx
 *   OTEL_SERVICE_NAME=blog-api          # 默认 'blog-api',不需要改
 *
 * 默认 auto-instrumentation 会拦截:
 *   - 所有 HTTP request(inbound + outbound,含 fetch ai-service)
 *   - Postgres / Prisma 查询
 *   - 异步 callback chain(避免 trace context 丢失)
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'blog-api',
    }),
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        // 默认行为太啰嗦,关掉 fs(每个文件读都发 span 没意义)
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
  sdk.start();

  // 进程退出时优雅 flush 残留 spans
  process.on('SIGTERM', () => {
    sdk.shutdown().catch(() => undefined);
  });
}
