import * as Joi from 'joi';

export const validationSchema = Joi.object({
  API_GATEWAY_PORT: Joi.number().default(4000),
  API_GATEWAY_HOST: Joi.string().default('0.0.0.0'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Service Hosts and Ports
  AUTH_HOST: Joi.string().uri().default('http://localhost'),
  AUTH_PORT: Joi.number().default(4001),
  USER_HOST: Joi.string().uri().default('http://localhost'),
  USER_PORT: Joi.number().default(4002),
  EMAIL_HOST: Joi.string().uri().default('http://localhost'),
  EMAIL_PORT: Joi.number().default(4003),
  RELATIONSHIP_HOST: Joi.string().uri().default('http://localhost'),
  RELATIONSHIP_PORT: Joi.number().default(4004),
  WALLET_HOST: Joi.string().uri().default('http://localhost'),
  WALLET_PORT: Joi.number().default(4005),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),

  // Cache
  CACHE_TTL: Joi.number().default(300),
});
