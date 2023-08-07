import * as Joi from 'joi';

export class ChangeEmailDto {
  email: string;
}
export const changeEmailSchema = Joi.object<ChangeEmailDto>({
  email: Joi.string().email().required().label('Email'),
});
