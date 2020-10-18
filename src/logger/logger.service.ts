import { Injectable } from '@nestjs/common';
import { LoggerService as UpstreamLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements UpstreamLoggerService {
  public debug(message: any, context?: string): any {
    winston.debug(message, context);
  }

  public error(message: any, trace?: string, context?: string): any {
    winston.error(`${message}\n${trace}`, context);
  }

  public log(message: any, context?: string): any {
    winston.info(message, context);
  }

  public verbose(message: any, context?: string): any {
    winston.info(message, context);
  }

  public warn(message: any, context?: string): any {
    winston.warn(message, context);
  }
}
