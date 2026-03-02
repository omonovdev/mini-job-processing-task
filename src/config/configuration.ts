export default () => ({
  port: parseInt(process.env.PORT!, 10),

  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },

  redis: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!, 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN!,
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10),
  },

  rateLimit: {
    email: {
      max: parseInt(process.env.RATE_LIMIT_EMAIL_MAX ?? '5', 10),
      window: parseInt(process.env.RATE_LIMIT_EMAIL_WINDOW ?? '60', 10),
    },
    report: {
      max: parseInt(process.env.RATE_LIMIT_REPORT_MAX ?? '2', 10),
      window: parseInt(process.env.RATE_LIMIT_REPORT_WINDOW ?? '60', 10),
    },
  },

  admin: {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
  },
});
