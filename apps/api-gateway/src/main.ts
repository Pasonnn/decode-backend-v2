/**
 * @fileoverview API Gateway Application Bootstrap
 *
 * This is the main entry point for the Decode API Gateway application. It initializes
 * the NestJS application with comprehensive middleware, security configurations,
 * and API documentation setup.
 *
 * The bootstrap process includes:
 * - Application initialization with NestJS factory
 * - Global middleware configuration (CORS, Security, Logging, Request ID)
 * - Global interceptors for request/response transformation
 * - Global exception filters for error handling
 * - Global validation pipes for input validation
 * - Swagger/OpenAPI documentation setup
 * - Server startup with environment-based configuration
 *
 * Security Features:
 * - CORS configuration for cross-origin requests
 * - Helmet middleware for security headers
 * - Request ID tracking for audit trails
 * - Comprehensive logging for monitoring
 * - Input validation and sanitization
 * - JWT authentication setup
 *
 * API Documentation:
 * - Swagger/OpenAPI 3.0 specification
 * - Interactive API explorer
 * - Bearer token authentication support
 * - Comprehensive endpoint documentation
 * - Custom styling and branding
 *
 * Performance & Monitoring:
 * - Request/response transformation
 * - Centralized error handling
 * - Request correlation IDs
 * - Health check endpoints
 * - Service discovery integration
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application initialization and configuration
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Application module and configuration
import { ApiGatewayModule } from './api-gateway.module';

// Global exception filters for centralized error handling
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

// Global middleware for request processing and security
import { CorsMiddleware } from './common/middleware/cors.middleware';
import { HelmetMiddleware } from './common/middleware/helmet.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

// Global interceptors for request/response transformation
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

// Datadog observability
import 'dd-trace/init';

/**
 * Bootstrap function to initialize and configure the API Gateway application
 *
 * This function sets up the complete application stack including:
 * - Middleware configuration for security, logging, and request processing
 * - Global interceptors for request/response transformation
 * - Exception filters for centralized error handling
 * - Validation pipes for input validation
 * - Swagger documentation setup
 * - Server startup with environment configuration
 *
 * @returns Promise<void> - Resolves when the application is successfully started
 */
async function bootstrap() {
  // Create the NestJS application instance
  const app = await NestFactory.create(ApiGatewayModule);
  const configService = app.get(ConfigService);

  // Initialize middleware instances for request processing
  const corsMiddleware = new CorsMiddleware(); // Cross-Origin Resource Sharing configuration
  const helmetMiddleware = new HelmetMiddleware(); // Security headers middleware
  const requestLoggerMiddleware = new RequestLoggerMiddleware(); // Request logging middleware
  const requestIdMiddleware = new RequestIdMiddleware(); // Request ID generation middleware

  // Apply global middleware in the correct order
  // Order matters: CORS first, then security, then request processing
  app.use(corsMiddleware.use.bind(corsMiddleware)); // Enable CORS for cross-origin requests
  app.use(helmetMiddleware.use.bind(helmetMiddleware)); // Add security headers
  app.use(requestIdMiddleware.use.bind(requestIdMiddleware)); // Generate unique request IDs
  app.use(requestLoggerMiddleware.use.bind(requestLoggerMiddleware)); // Log all requests

  // Configure global interceptors for request/response processing
  app.useGlobalInterceptors(
    new RequestIdInterceptor(), // Add request ID to all responses
    new ResponseTransformInterceptor(), // Transform responses to standard format
  );

  // Configure global exception filters for centralized error handling
  app.useGlobalFilters(
    new ValidationExceptionFilter(), // Handle validation errors with proper formatting
    new HttpExceptionFilter(), // Handle HTTP exceptions with consistent error responses
  );

  // Configure global validation pipe for input validation and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable automatic type conversion
      },
    }),
  );

  // Configure Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Decode API Gateway') // API title
    .setDescription('API Gateway for Decode Backend Services') // API description
    .setVersion('1.0') // API version
    .addTag('auth', 'Authentication and authorization endpoints') // Auth service endpoints
    .addTag('users', 'User management endpoints') // User service endpoints
    .addTag('wallet', 'Wallet management endpoints') // Wallet service endpoints
    .addTag('relationship', 'Relationship management endpoints') // Relationship service endpoints
    .addTag('notifications', 'Notification management endpoints') // Notification service endpoints
    .addTag('email', 'Email service endpoints') // Email worker endpoints
    .addTag('health', 'Health check endpoints') // Health monitoring endpoints
    .addBearerAuth(
      {
        type: 'http', // HTTP authentication type
        scheme: 'bearer', // Bearer token scheme
        bearerFormat: 'JWT', // JWT token format
        name: 'JWT', // Authentication name
        description: 'Enter JWT token', // User instruction
        in: 'header', // Token location
      },
      'JWT-auth', // Authentication scheme identifier for decorators
    )
    .addServer('http://localhost:4000', 'Development server') // Development server URL
    .build();

  // Generate OpenAPI specification document
  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI with custom configuration
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Persist authentication across page refreshes
      tagsSorter: 'alpha', // Sort tags alphabetically
      operationsSorter: 'alpha', // Sort operations alphabetically
    },
    customSiteTitle: 'Decode API Documentation', // Custom page title
    customCss: `
      .swagger-ui .topbar { display: none } /* Hide Swagger top bar */
      .swagger-ui .info .title { color: #2c3e50; } /* Custom title color */
      .swagger-ui .info .description { color: #34495e; } /* Custom description color */
    `, // Custom CSS styling
  });

  // Get server configuration from environment variables
  const port = configService.get<number>('API_GATEWAY_PORT') || 4000; // Default port 4000
  const host = configService.get<string>('API_GATEWAY_HOST') || 'localhost'; // Default host localhost

  // Start the server and listen for incoming requests
  await app.listen(port, host);

  // Log successful startup information
  console.info(`[ApiGateway] API Gateway is running on ${host}:${port}`);
  console.info(
    `[ApiGateway] Swagger documentation available at http://${host}:${port}/docs`,
  );
}

/**
 * Application startup with error handling
 *
 * This function starts the API Gateway application and handles any startup errors.
 * If the application fails to start, it logs the error and exits the process.
 */
bootstrap().catch((error) => {
  console.error('Failed to start API Gateway:', error);
  process.exit(1); // Exit with error code 1
});
