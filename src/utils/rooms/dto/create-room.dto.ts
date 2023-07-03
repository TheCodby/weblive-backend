import * as Joi from 'joi';

export class CreateRoomDto {
  roomName: string;
  roomPassword?: string;
  roomDescription?: string;
  passwordProtected: boolean;
}
export const createRoomSchema = Joi.object({
  roomName: Joi.string().required(),
  roomPassword: Joi.string()
    .optional()
    .allow('')
    .when('passwordProtected', {
      is: true,
      then: Joi.required().description('Password is required').not(''),
    }),
  roomDescription: Joi.string().optional().allow(''),
  passwordProtected: Joi.boolean().required(),
});
