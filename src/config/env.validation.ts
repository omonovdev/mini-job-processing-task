import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(2000),

  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required(),

  REDIS_HOST: Joi.string().hostname().required(),
  REDIS_PORT: Joi.number().port().default(6379),

  JWT_SECRET: Joi.string().min(8).required(),
  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('30m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d'),

  BCRYPT_SALT_ROUNDS: Joi.number().min(4).max(16).default(10),

  RATE_LIMIT_EMAIL_MAX: Joi.number().min(1).default(5),
  RATE_LIMIT_EMAIL_WINDOW: Joi.number().min(1).default(60),
  RATE_LIMIT_REPORT_MAX: Joi.number().min(1).default(2),
  RATE_LIMIT_REPORT_WINDOW: Joi.number().min(1).default(60),

  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().min(6).max(128).required(),
});
