import { Injectable } from '@nestjs/common';
import { LoggerService as UpstreamLoggerService } from '@nestjs/common';
import * as winston from 'winston';

/**
 * A service based on winston for logging
 */
@Injectable()
export class LoggerService implements UpstreamLoggerService {
  /**
   * Send a debug message
   * @param message message
   * @param context message context
   */
  public debug(message: any, context?: string): any {
    winston.debug(message, context);
  }

  /**
   * Send an error message
   * @param message message
   * @param context message context
   */
  public error(message: any, trace?: string, context?: string): any {
    winston.error(`${message}\n${trace}`, context);
  }

  /**
   * Send a standard log message
   * @param message message
   * @param context message context
   */
  public log(message: any, context?: string): any {
    winston.info(message, context);
  }

  /**
   * Send a verbose message
   * @param message message
   * @param context message context
   */
  public verbose(message: any, context?: string): any {
    winston.info(message, context);
  }

  /**
   * Send a warning message
   * @param message message
   * @param context message context
   */
  public warn(message: any, context?: string): any {
    winston.warn(message, context);
  }
}
