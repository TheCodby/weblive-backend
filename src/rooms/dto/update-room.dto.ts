import { PartialType } from '@nestjs/mapped-types';
import * as Joi from 'joi';
import { CreateRoomDto } from './create-room.dto';

export const updateRoomSchema = Joi.object({
  name: Joi.string().required,
  password: Joi.string()
    .optional()
    .allow('')
    .when('password_protected', {
      is: true,
      then: Joi.required().description('Password is required').not(''),
    }),
  description: Joi.string().optional().allow(''),
  password_protected: Joi.boolean().required(),
});
export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
