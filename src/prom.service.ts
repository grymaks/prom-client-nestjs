import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import * as promClient from 'prom-client';
import { PromModuleOptions, defaultOptions } from './interfaces/prom-options.interface';

@Injectable()
export class PromService implements OnModuleInit {
  private readonly registry: promClient.Registry;
  private readonly options: PromModuleOptions;
  private httpServerRequests?: promClient.Summary<string>;

  constructor(@Inject('PROM_OPTIONS') options: PromModuleOptions) {
    this.options = { ...defaultOptions, ...options };
    this.registry = new promClient.Registry();
  }

  onModuleInit() {
    const defaultLabels: Record<string, string> = {};
    if (this.options.appName) defaultLabels.app = this.options.appName;
    if (this.options.environment) defaultLabels.environment = this.options.environment;
    if (this.options.defaultLabels) Object.assign(defaultLabels, this.options.defaultLabels);
    
    if (Object.keys(defaultLabels).length > 0) {
      this.registry.setDefaultLabels(defaultLabels);
    }

    if (this.options.withDefaultMetrics) {
      promClient.collectDefaultMetrics({
        register: this.registry,
      });
    }

    if (this.options.withHttpMetrics) {
      this.httpServerRequests = new promClient.Summary({
        name: 'http_server_requests_seconds',
        help: 'HTTP server request duration in seconds',
        labelNames: ['method', 'status', 'uri', 'outcome', 'exception'],
        percentiles: [0.5, 0.95, 0.99],
        maxAgeSeconds: 600,
        ageBuckets: 5,
        registers: [this.registry],
      });
    }
  }

  getRegistry(): promClient.Registry {
    return this.registry;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  observeHttpRequest(
    method: string,
    status: number,
    uri: string,
    duration: number,
    exception: string = 'none'
  ): void {
    if (!this.httpServerRequests) return;

    const outcome = this.getOutcome(status);
    
    this.httpServerRequests
      .labels(method, status.toString(), uri, outcome, exception)
      .observe(duration);
  }

  private getOutcome(status: number): string {
    if (status >= 200 && status < 300) return 'SUCCESS';
    if (status >= 400 && status < 500) return 'CLIENT_ERROR';
    if (status >= 500) return 'SERVER_ERROR';
    return 'UNKNOWN';
  }

  createCounter(
    name: string,
    help: string,
    labelNames?: string[]
  ): promClient.Counter<string> {
    const counter = new promClient.Counter({
      name,
      help,
      labelNames: labelNames || [],
      registers: [this.registry],
    });
    return counter;
  }

  createGauge(
    name: string,
    help: string,
    labelNames?: string[]
  ): promClient.Gauge<string> {
    const gauge = new promClient.Gauge({
      name,
      help,
      labelNames: labelNames || [],
      registers: [this.registry],
    });
    return gauge;
  }

  createHistogram(
    name: string,
    help: string,
    labelNames?: string[],
    buckets?: number[]
  ): promClient.Histogram<string> {
    const histogram = new promClient.Histogram({
      name,
      help,
      labelNames: labelNames || [],
      buckets: buckets || this.options.httpDurationBuckets,
      registers: [this.registry],
    });
    return histogram;
  }

  createSummary(
    name: string,
    help: string,
    labelNames?: string[],
    percentiles?: number[]
  ): promClient.Summary<string> {
    const summary = new promClient.Summary({
      name,
      help,
      labelNames: labelNames || [],
      percentiles: percentiles || [0.5, 0.95, 0.99],
      maxAgeSeconds: 600,
      ageBuckets: 5,
      registers: [this.registry],
    });
    return summary;
  }
}
