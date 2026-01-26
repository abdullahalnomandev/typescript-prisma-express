import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

export type USER_ROLE = 'super_admin' | 'admin' | 'user';
export type USER_STATUS = 'active' | 'block';

export type IUser = {
  id: number;
  email: string;
  name: string;
  password: string;
  role: USER_ROLE;
  image: string;
  status: USER_STATUS;
  verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

