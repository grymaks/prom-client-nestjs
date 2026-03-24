// interfaces/prom-options.interface.ts
export interface PromModuleOptions {
  /**
   * Path for metrics endpoint (default: '/metrics')
   */
  metricPath?: string;
  
  /**
   * Enable default Node.js metrics (memory, CPU, event loop)
   */
  withDefaultMetrics?: boolean;
  
  /**
   * Enable HTTP request metrics
   */
  withHttpMetrics?: boolean;
  
  /**
   * Custom buckets for HTTP duration histogram
   */
  httpDurationBuckets?: number[];
  
  /**
   * Default labels to add to all metrics
   */
  defaultLabels?: Record<string, string>;
  
  /**
   * Application name (added as label)
   */
  appName?: string;
  
  /**
   * Environment (added as label)
   */
  environment?: string;
}

export const defaultOptions: PromModuleOptions = {
  metricPath: '/metrics',
  withDefaultMetrics: true,
  withHttpMetrics: true,
  httpDurationBuckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
};
