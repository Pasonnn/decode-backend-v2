import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { CorsMiddleware } from './common/middleware/cors.middleware';
import { HelmetMiddleware } from './common/middleware/helmet.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const configService = app.get(ConfigService);

  const corsMiddleware = new CorsMiddleware();
  const helmetMiddleware = new HelmetMiddleware();
  const requestLoggerMiddleware = new RequestLoggerMiddleware();
  const requestIdMiddleware = new RequestIdMiddleware();

  // Apply middleware
  app.use(corsMiddleware.use.bind(corsMiddleware));
  app.use(helmetMiddleware.use.bind(helmetMiddleware));
  app.use(requestIdMiddleware.use.bind(requestIdMiddleware));
  app.use(requestLoggerMiddleware.use.bind(requestLoggerMiddleware));

  // Global interceptors
  app.useGlobalInterceptors(
    new RequestIdInterceptor(),
    new ResponseTransformInterceptor(),
  );

  // Global exception filters
  app.useGlobalFilters(
    new ValidationExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // Global pipes - following your auth service pattern
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Decode API Gateway')
    .setDescription('API Gateway for Decode Backend Services')
    .setVersion('1.0')
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('wallet', 'Wallet management endpoints')
    .addTag('relationship', 'Relationship management endpoints')
    .addTag('email', 'Email service endpoints')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for references
    )
    .addServer('http://localhost:4000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Decode API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .info .description { color: #34495e; }
    `,
  });

  const port = configService.get<number>('apiGateway.port') || 4000;
  const host = configService.get<string>('apiGateway.host') || '0.0.0.0';

  await app.listen(port, host);
  console.info(`[ApiGateway] API Gateway is running on ${host}:${port}`);
  console.info(
    `[ApiGateway] Swagger documentation available at http://${host}:${port}/docs`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start API Gateway:', error);
  process.exit(1);
});
