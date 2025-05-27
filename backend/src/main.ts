import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix (optional, e.g., /api/v1)
  // app.setGlobalPrefix('api/v1');

  // Global Pipes for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties not defined in DTO
      transform: true, // Automatically transforms payloads to DTO instances
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Convert string params to numbers, booleans where expected
      },
    }),
  );

  // Enable CORS (configure as needed for production)
  app.enableCors({
    origin: true, // Reflects the request origin, or specify domains
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  // For Prisma Studio, remind user if DATABASE_URL is not set
  if (!configService.get<string>('DATABASE_URL')) {
    logger.warn(
      'DATABASE_URL is not set in .env file. Prisma Studio and database operations will fail.',
    );
  }
}
bootstrap();
