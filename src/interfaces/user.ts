import { Request } from 'express';
export interface User {
  id: number;
  username: string;
  admin: boolean;
}
export interface RequestWithUser extends Request {
  user: User;
}
