import * as Joi from 'joi';

export const createAuthSchema = Joi.object({
  username: Joi.string().required().min(3),
  password: Joi.string().required().min(6),
});
export class UserAuthDto {
  username: string;
  password: string;
}
