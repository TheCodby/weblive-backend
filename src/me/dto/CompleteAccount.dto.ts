import * as Joi from 'joi';
export class CompleteAccountDto {
  password: string;
  confirmPassword: string;
}
export const completeAccountSchema = Joi.object<CompleteAccountDto>({
  password: Joi.string().min(6).max(30).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});
