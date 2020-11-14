import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as logform from 'logform';
import { LoggerService } from './logger/logger.service';

/**
 * Bootstrap Nest server
 */
async function bootstrap() {
  winston.configure({
    transports: [new winston.transports.Console()],
    format: logform.format.combine(
      logform.format.timestamp(),
      logform.format.printf(info => {
        return `${info.timestamp} [${info.level.toUpperCase()}] ${
          info.message
        }`;
      }),
    ),
  });

  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });
  const configService = app.get<ConfigService>(ConfigService);

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  winston.level = configService.get('AM_LOGLEVEL');

  winston.info('Starting aliasmanager');

  winston.info('Creating OpenApi endpoint');
  const options = new DocumentBuilder()
    .setTitle('AliasManager API')
    .setDescription('The API for the AliasManager')
    .setVersion('1.0')
    .addBasicAuth()
    .addCookieAuth(configService.get('AM_TOKEN_COOKIE'))
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  SwaggerModule.setup('api', app, document);

  const port = configService.get('AM_PORT');
  winston.info(`Starting service on port ${port}`);
  await app.listen(port);
}

bootstrap();
