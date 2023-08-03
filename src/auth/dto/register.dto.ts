import { UserAuthDto, authSchema } from './user-auth.dto';
import * as Joi from 'joi';
export const registerSchema = authSchema.keys({
  email: Joi.string().email().required(),
});

export class RegisterDto extends UserAuthDto {
  email: string;
}
