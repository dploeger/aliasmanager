import * as winston from 'winston';
import * as logform from 'logform';

/**
 * Setting up a winston basic logger for test logging
 */
export function setupLogger() {
  winston.configure({
    transports: [new winston.transports.Console()],
    level: 'debug',
    format: logform.format.combine(
      logform.format.timestamp(),
      logform.format.printf(info => {
        return `${info.timestamp} [${info.level.toUpperCase()}] ${
          info.message
        }`;
      }),
    ),
  });
}
