import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PromService } from './prom.service';

@Injectable()
export class PromInterceptor implements NestInterceptor {
  constructor(private readonly promService: PromService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const route = req.route?.path || req.path;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - start) / 1000;
          const res = context.switchToHttp().getResponse();
          
          this.promService.observeHttpRequest(
            method,
            res.statusCode,
            route,
            duration
          );
        },
        error: (err) => {
          const duration = (Date.now() - start) / 1000;
          
          this.promService.observeHttpRequest(
            method,
            err.status || 500,
            route,
            duration,
            err.name || 'Exception'
          );
        },
      }),
    );
  }
}
