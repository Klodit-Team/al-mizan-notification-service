import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8010);
  const apiPrefix = configService.get<string>('API_PREFIX', 'notification-service/v1');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: nodeEnv === 'development' ? '*' : false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-roles'],
  });

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE', 'Al-Mizan – Service Notifications'))
      .setDescription(
        configService.get<string>(
          'SWAGGER_DESCRIPTION',
          'Microservice de gestion des notifications – emails, SMS, push Android, alertes IA',
        ),
      )
      .setVersion(configService.get<string>('SWAGGER_VERSION', '1.0'))
      .addTag('notifications', 'Gestion des notifications utilisateurs')
      .addTag('alertes-ia', 'Alertes IA et incidents')
      .addTag('rapports-ia', 'Rapports périodiques IA')
      .addTag('tokens-fcm', 'Gestion des tokens Firebase Cloud Messaging')
      .addTag('preferences', 'Préférences de notification utilisateur')
      .addTag('health', 'Health check')
      .addApiKey({ type: 'apiKey', name: 'x-user-id', in: 'header' }, 'x-user-id')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    Logger.log(`Swagger disponible : http://localhost:${port}/${apiPrefix}/docs`, 'Bootstrap');
  }

  await app.listen(port);
  Logger.log(`Notification Service démarré sur http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
}

bootstrap();
