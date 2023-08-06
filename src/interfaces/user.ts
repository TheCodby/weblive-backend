import { Request } from 'express';
export interface IUser {
  id: number;
  username: string;
  admin: boolean;
}
export interface RequestWithUser extends Request {
  user: IUser;
}
