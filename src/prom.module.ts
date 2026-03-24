import { Module, DynamicModule, Global, MiddlewareConsumer, NestModule, Controller, Get, Header } from '@nestjs/common';
import { PromService } from './prom.service';
import { PromMiddleware } from './prom.middleware';
import { PromInterceptor } from './prom.interceptor';
import { PromModuleOptions, defaultOptions } from './interfaces/prom-options.interface';

@Global()
@Module({})
export class PromModule implements NestModule {
  static forRoot(options?: PromModuleOptions): DynamicModule {
    const opts = { ...defaultOptions, ...options };
    const metricPath = opts.metricPath || '/actuator/prometheus';
    
    @Controller(metricPath)
    class PromDynamicController {
      constructor(private readonly promService: PromService) {}

      @Get()
      @Header('Content-Type', 'text/plain; version=0.0.4')
      async getMetrics(): Promise<string> {
        return this.promService.getMetrics();
      }
    }
    
    return {
      module: PromModule,
      controllers: [PromDynamicController],
      providers: [
        PromService,
        PromInterceptor,
        {
          provide: 'PROM_OPTIONS',
          useValue: opts,
        },
      ],
      exports: [PromService, PromInterceptor],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PromMiddleware)
      .forRoutes('*');
  }
}
