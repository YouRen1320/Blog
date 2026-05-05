"""
OpenTelemetry 初始化。

设计跟 NestJS 端 instrumentation.ts 对齐:
- 默认不开启(没设 OTEL_EXPORTER_OTLP_ENDPOINT 就完全不挂 instrumentation)
- 设了就 trace FastAPI 路由 + 出站 httpx 调用,跟 NestJS 端串成跨服务链路

启用方式(同 NestJS 端):
  OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
  OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=xxx
  OTEL_SERVICE_NAME=blog-ai-service       # 默认值,不需要改
"""

import logging
import os

log = logging.getLogger(__name__)


def setup_otel(app) -> None:
    """如果设了 OTEL_EXPORTER_OTLP_ENDPOINT 就挂 FastAPI + httpx instrumentation。"""
    if not os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT"):
        return

    # 延迟 import,避免没启用时也加载 OTel 一堆包
    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    service_name = os.environ.get("OTEL_SERVICE_NAME", "blog-ai-service")
    provider = TracerProvider(resource=Resource.create({"service.name": service_name}))
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app)
    HTTPXClientInstrumentor().instrument()

    log.info("OpenTelemetry tracing enabled (service=%s)", service_name)
