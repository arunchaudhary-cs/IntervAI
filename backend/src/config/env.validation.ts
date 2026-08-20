
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  PORT: Joi.number()
    .port()
    .default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string()
    .min(16)
    .required(),

  JWT_REFRESH_SECRET: Joi.string()
    .min(16)
    .required(),

  GEMINI_API_KEY: Joi.string().required(),

  FRONTEND_URL: Joi.string()
    .uri()
    .default('http://localhost:5173'),

  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional(),
});