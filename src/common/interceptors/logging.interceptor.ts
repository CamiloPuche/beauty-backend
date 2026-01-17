import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const { method, url, body } = request;
        const correlationId = (request as any).correlationId || 'N/A';
        const userAgent = request.get('user-agent') || '';
        const startTime = Date.now();

        // Log request
        this.logger.log(
            `[${correlationId}] ${method} ${url} - Start - UA: ${userAgent.substring(0, 50)}`,
        );

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - startTime;
                    const statusCode = response.statusCode;
                    this.logger.log(
                        `[${correlationId}] ${method} ${url} - ${statusCode} - ${duration}ms`,
                    );
                },
                error: (error) => {
                    const duration = Date.now() - startTime;
                    const statusCode = error.status || 500;
                    this.logger.error(
                        `[${correlationId}] ${method} ${url} - ${statusCode} - ${duration}ms - ${error.message}`,
                    );
                },
            }),
        );
    }
}
