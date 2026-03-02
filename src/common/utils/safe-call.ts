import { Logger } from '@nestjs/common';
import { extractErrorMessage } from './extract-error.js';

export async function safeCatch<T>(
  fn: () => Promise<T>,
  logger: Logger,
  errorContext: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error(`${errorContext}: ${extractErrorMessage(error)}`);
    throw error;
  }
}

export async function safeIgnore<T>(
  fn: () => Promise<T>,
  logger: Logger,
  errorContext: string,
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    logger.error(`${errorContext}: ${extractErrorMessage(error)}`);
    return null;
  }
}
