import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  TASK_ACCESS_DENIED = 'TASK_ACCESS_DENIED',
  DUPLICATE_IDEMPOTENCY_KEY = 'DUPLICATE_IDEMPOTENCY_KEY',
  TASK_NOT_CANCELLABLE = 'TASK_NOT_CANCELLABLE',
  TASK_NOT_REPROCESSABLE = 'TASK_NOT_REPROCESSABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.DUPLICATE_EMAIL]: 'Email already registered',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.ACCOUNT_DISABLED]: 'Account has been deactivated',
  [ErrorCode.TASK_NOT_FOUND]: 'Task not found',
  [ErrorCode.TASK_ACCESS_DENIED]: 'You do not have access to this task',
  [ErrorCode.DUPLICATE_IDEMPOTENCY_KEY]:
    'Task with this idempotency key already exists',
  [ErrorCode.TASK_NOT_CANCELLABLE]: 'Only PENDING tasks can be cancelled',
  [ErrorCode.TASK_NOT_REPROCESSABLE]: 'Only FAILED tasks can be reprocessed',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded, try again later',
};

const ERROR_STATUS: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.DUPLICATE_EMAIL]: HttpStatus.CONFLICT,
  [ErrorCode.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.ACCOUNT_DISABLED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.TASK_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.TASK_ACCESS_DENIED]: HttpStatus.FORBIDDEN,
  [ErrorCode.DUPLICATE_IDEMPOTENCY_KEY]: HttpStatus.CONFLICT,
  [ErrorCode.TASK_NOT_CANCELLABLE]: HttpStatus.CONFLICT,
  [ErrorCode.TASK_NOT_REPROCESSABLE]: HttpStatus.CONFLICT,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: HttpStatus.TOO_MANY_REQUESTS,
};

export class BusinessException extends HttpException {
  readonly errorCode: ErrorCode;

  constructor(code: ErrorCode, detail?: string) {
    const message = detail || ERROR_MESSAGES[code];
    const status = ERROR_STATUS[code];

    super({ statusCode: status, errorCode: code, message }, status);
    this.errorCode = code;
  }
}
