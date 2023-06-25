import * as Joi from 'joi';

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export const changePasswordSchema = Joi.object<ChangePasswordDto>({
  currentPassword: Joi.string().required().min(6).label('Current password'),
  newPassword: Joi.string().required().min(6).label('New password'),
  confirmPassword: Joi.string()
    .label('Confirm password')
    .required()
    .min(6)
    .equal(Joi.ref('newPassword'))
    .messages({ 'any.only': '{{#label}} does not match' }),
});
