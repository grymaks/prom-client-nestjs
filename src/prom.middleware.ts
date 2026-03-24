import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { PromService } from './prom.service';
import { PromModuleOptions } from './interfaces/prom-options.interface';

@Injectable()
export class PromMiddleware implements NestMiddleware {
  constructor(
    private readonly promService: PromService,
    @Inject('PROM_OPTIONS') private readonly options: PromModuleOptions,
  ) {}

  use(req: any, res: any, next: () => void): void {
    const metricPath = this.options.metricPath || '/actuator/prometheus';
    const requestPath = this.getRequestPath(req);
    
    if (requestPath === metricPath) {
      return next();
    }

    const start = Date.now();
    const method = this.getMethod(req);
    const route = this.getRoute(req);

    const onFinish = () => {
      const duration = (Date.now() - start) / 1000;
      const status = this.getStatus(res);
      
      this.promService.observeHttpRequest(method, status, route, duration);
    };

    this.onResponseFinish(res, onFinish);
    next();
  }

  private getRequestPath(req: any): string {
    if (req.originalUrl) {
      return this.normalizePath(req.originalUrl);
    }
    if (req.path) {
      return this.normalizePath(req.path);
    }
    if (req.url) {
      return this.normalizePath(req.url);
    }
    return '';
  }

  private getMethod(req: any): string {
    const method = req.method || req.method?.toUpperCase?.() || '';
    return method || 'UNKNOWN';
  }

  private getRoute(req: any): string {
    if (req.route?.path) {
      return req.route.path;
    }
    
    if (req.originalUrl) {
      return this.normalizePath(req.originalUrl);
    }
    
    if (req.path) {
      return this.normalizePath(req.path);
    }
    
    if (req.routerPath) {
      return req.routerPath;
    }
    
    if (req.url) {
      return this.normalizePath(req.url);
    }
    
    return 'unknown';
  }

  private getStatus(res: any): number {
    // Express
    if (typeof res.statusCode === 'number') {
      return res.statusCode;
    }
    
    if (res.statusCode !== undefined) {
      return res.statusCode;
    }
    
    if (typeof res.status === 'function') {
      return res.status();
    }
    
    return 200;
  }

  private onResponseFinish(res: any, callback: () => void): void {
    if (typeof res.on === 'function') {
      res.on('finish', callback);
      return;
    }
    
    if (res.raw && typeof res.raw.on === 'function') {
      res.raw.on('finish', callback);
      return;
    }
    
    if (res.socket && typeof res.socket.on === 'function') {
      res.socket.on('finish', callback);
      return;
    }
    
    setTimeout(callback, 0);
  }

  private normalizePath(url: string): string {
    if (!url) return '';
    const queryIndex = url.indexOf('?');
    return queryIndex === -1 ? url : url.slice(0, queryIndex);
  }
}
