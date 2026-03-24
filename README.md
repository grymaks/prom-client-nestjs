# prom-client-nestjs

NestJS module for Prometheus metrics. Automatically collects HTTP request metrics and Node.js system metrics, exposing them on a configurable endpoint.

## Features

- 🚀 **Simple setup** — add one line to your `AppModule`
- 🔄 **Works with Express and Fastify** — universal middleware
- 📈 **Automatic HTTP metrics** — request duration with quantiles (0.5, 0.95, 0.99)
- 💻 **System metrics** — memory, CPU, event loop, active handles
- 🏷️ **Custom labels** — add app name, environment, or custom labels to all metrics
- 🔧 **Custom metrics** — create counters, gauges, histograms, and summaries

## Installation

```bash
npm install prom-client-nestjs prom-client
```

## Quick Start

Add `PromModule` to your `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { PromModule } from 'prom-client-nestjs';

@Module({
  imports: [
    PromModule.forRoot({
      metricPath: '/metrics',              // metrics endpoint
      withDefaultMetrics: true,            // collect Node.js system metrics
      withHttpMetrics: true,               // collect HTTP request metrics
      appName: 'my-nestjs-app',            // add app label to all metrics
      environment: process.env.NODE_ENV,   // add environment label
    }),
  ],
})
export class AppModule {}
```

That's it! Your metrics will be available at `http://localhost:3000/metrics`.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `metricPath` | `string` | `/metrics` | Endpoint path for metrics |
| `withDefaultMetrics` | `boolean` | `true` | Collect Node.js system metrics (memory, CPU, event loop) |
| `withHttpMetrics` | `boolean` | `true` | Collect HTTP request duration metrics |
| `httpDurationBuckets` | `number[]` | `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]` | Histogram buckets for HTTP duration |
| `defaultLabels` | `Record<string, string>` | `{}` | Default labels added to all metrics |
| `appName` | `string` | `undefined` | Application name label |
| `environment` | `string` | `undefined` | Environment label |

## Metrics

### HTTP Request Metrics (when `withHttpMetrics: true`)

- `http_request_duration_seconds` — request duration histogram with quantiles (0.5, 0.95, 0.99)
- Labels: `method`, `status`, `path`, `outcome` (SUCCESS/CLIENT_ERROR/SERVER_ERROR)

### System Metrics (when `withDefaultMetrics: true`)

- `nodejs_heap_size_used_bytes` — used heap size
- `nodejs_heap_size_total_bytes` — total heap size
- `nodejs_external_memory_bytes` — external memory
- `nodejs_eventloop_lag_seconds` — event loop lag
- `nodejs_active_handles_total` — active handles count
- `nodejs_active_requests_total` — active requests count
- `process_cpu_seconds_total` — total CPU time
- `process_start_time_seconds` — process start time
- `process_resident_memory_bytes` — RSS memory

## Custom Metrics

Inject `PromService` and create custom metrics:

```typescript
import { Injectable } from '@nestjs/common';
import { PromService } from 'prom-client-nestjs';
import * as promClient from 'prom-client';

@Injectable()
export class MyService {
  private orderCounter: promClient.Counter<string>;

  constructor(private readonly promService: PromService) {
    // Create a custom counter
    this.orderCounter = this.promService.createCounter(
      'orders_total',
      'Total number of orders',
      ['status']
    );
  }

  async createOrder() {
    // ... business logic
    this.orderCounter.labels('success').inc();
  }
}
```

### Available Methods

| Method | Description |
|--------|-------------|
| `createCounter(name, help, labelNames?)` | Create a counter metric |
| `createGauge(name, help, labelNames?)` | Create a gauge metric |
| `createHistogram(name, help, labelNames?, buckets?)` | Create a histogram metric |
| `createSummary(name, help, labelNames?, percentiles?)` | Create a summary metric |
| `getMetrics()` | Get all metrics in Prometheus text format |

## Advanced Usage

### Custom Labels

Add default labels to all metrics:

```typescript
PromModule.forRoot({
  defaultLabels: {
    service: 'my-service',
    region: 'eu-west-1',
  },
})
```

### Custom HTTP Duration Buckets

```typescript
PromModule.forRoot({
  httpDurationBuckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
})
```

## License

MIT
