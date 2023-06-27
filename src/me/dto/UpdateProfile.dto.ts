import * as Joi from 'joi';

export class UpdateProfileDto {
  username: string;
  bio?: string;
}

export const updateProfileSchema = Joi.object<UpdateProfileDto>({
  username: Joi.string().required().label('Username'),
  bio: Joi.string().allow('').label('Bio'),
});
