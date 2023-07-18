import * as Joi from 'joi';

export class CreateRoomDto {
  name: string;
  password?: string;
  description?: string;
  password_protected: boolean;
}
export const createRoomSchema = Joi.object({
  name: Joi.string().required(),
  password: Joi.string()
    .when('password_protected', {
      is: true,
      then: Joi.required().description('Password is required').not(''),
    })
    .when('password_protected', {
      is: false,
      then: Joi.optional().allow(''),
    }),
  description: Joi.string().optional().allow(''),
  password_protected: Joi.boolean().required(),
});
