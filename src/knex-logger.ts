import {
  LoggersConfig, logFormatter, LOG_DATE_PATTERNT, LOG_MAX_SIZE, LOG_MAX_FILES,
} from '@via-profit-services/core';
import Winston from 'winston';
import 'winston-daily-rotate-file';

import { LOG_FILENAME_SQL } from './constants';

export default (config: LoggersConfig) => {
  const { logDir } = config;
  const { createLogger, transports, format } = Winston;

  return createLogger({
    level: 'debug',
    format: logFormatter,
    transports: [
      new transports.DailyRotateFile({
        filename: `${logDir}/${LOG_FILENAME_SQL}`,
        level: 'debug',
        datePattern: LOG_DATE_PATTERNT,
        zippedArchive: true,
        maxSize: LOG_MAX_SIZE,
        maxFiles: LOG_MAX_FILES,
      }),
      new transports.Console({
        level: 'error',
        format: format.combine(
          format.colorize({
            all: true,
          }),
          format.simple(),
        ),
      }),
    ],
  });
};

