import { TLocale } from '@/src/types/main';
import { UserAuthDto, authSchema } from './user-auth.dto';
import * as Joi from 'joi';

export const registerSchema = authSchema.keys({
  email: Joi.string().email().required(),
  locale: Joi.string().default('en').allow('en', 'ar'),
});

export class RegisterDto extends UserAuthDto {
  email: string;
  locale: TLocale;
}
