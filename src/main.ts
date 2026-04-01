import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // CORS with explicit configuration from .env
  const corsOrigin = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({
    origin: corsOrigin,
    credentials: process.env.CORS_CREDENTIALS === 'true',
  });

  // Increase payload size limit for base64 encoded images (default is 100KB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter - must be after validation pipe
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger documentation
  const swaggerEnabled = process.env.SWAGGER_ENABLED;
  if (swaggerEnabled !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('TB Detection API')
      .setDescription(
        'Complete TB detection and patient management system with authentication, authorization, and ML integration',
      )
      .setVersion('2.0.0')
      .addBearerAuth()
      .addTag('Authentication', 'User registration and login')
      .addTag('Users', 'User management and roles')
      .addTag('Patients', 'Patient registration and management')
      .addTag('X-Rays', 'X-ray upload and management')
      .addTag('Diagnosis Results', 'TB diagnosis results and interpretations')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Use GATEWAY_PORT from .env (defaults to 3000 for development)
  const envPort = process.env.GATEWAY_PORT;
  const basePort = parseInt(
    envPort !== undefined && envPort !== '' ? envPort : '3000',
    10,
  );

  // Port fallback logic - try sequential ports if the one specified is in use
  const maxAttempts = 5;
  let listeningPort = basePort;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await app.listen(listeningPort);
      break; // Successfully listening
    } catch (error) {
      if (error instanceof Error && error.message.includes('EADDRINUSE')) {
        listeningPort += 1;
        console.warn(
          `Port ${listeningPort - 1} in use, attempting port ${listeningPort}...`,
        );
        if (attempt === maxAttempts - 1) {
          throw new Error(
            `Could not find available port (tried ${basePort}-${listeningPort - 1})`,
          );
        }
      } else {
        throw error;
      }
    }
  }

  // Using standard console or NestJS Logger
  console.log(
    `✅ TB Detection API running on http://localhost:${listeningPort}`,
  );
  console.log(
    `📚 Swagger docs available at http://localhost:${listeningPort}/api`,
  );
}

bootstrap().catch((err: Error) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
