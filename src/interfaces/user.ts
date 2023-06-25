import { Request } from 'express';
export interface User {
  id: number;
  username: string;
}
export interface RequestWithUser extends Request {
  user: User;
}
