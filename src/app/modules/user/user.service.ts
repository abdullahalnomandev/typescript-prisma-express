import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import unlinkFile from '../../../shared/unlinkFile';
import { IUser } from './user.interface';
import db from '../../../shared/prisma';

const createUserToDB = async (payload: Partial<IUser>): Promise<Partial<IUser>> => {
  // Set role for user on create
  payload.role = USER_ROLES.USER;

  const { name, email, password } = payload;

  if (!name || !email || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Name, email, and password are required");
  }

  // Check for duplicate email
  // Hash password before creating user
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email already exists");
  }

  // Hash the password before saving it to DB
  const bcrypt = require('bcrypt');
  const hashPassword = await bcrypt.hash(
    password!,
    Number(process.env.BCRYPT_SALT_ROUNDS || 10)
  );

  const createdUser = await db.user.create({
    data: {
      name,
      email,
      password: hashPassword,
      role: payload.role,
    }
  });

  if (!createdUser) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create user');
  }

  return {
    id: createdUser.id,
    email: createdUser.email,
    name: createdUser.name ?? undefined,
    role: createdUser.role,
    image: createdUser.image ?? undefined,
    status: createdUser.status,
    verified: createdUser.verified,
    createdAt: createdUser.createdAt,
    updatedAt: createdUser.updatedAt,
  };
};

const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await db.user.findUnique({
    where: { id: Number(id) },
  });
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return {
    id: isExistUser.id,
    email: isExistUser.email,
    name: isExistUser.name ?? undefined,
    role: isExistUser.role,
    image: isExistUser.image ?? undefined,
    status: isExistUser.status,
    verified: isExistUser.verified,
    createdAt: isExistUser.createdAt,
    updatedAt: isExistUser.updatedAt,
  };
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const numericId = Number(id);

  // Find current user
  const isExistUser = await db.user.findUnique({
    where: { id: numericId },
  });
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // Unlink previous image if new image provided
  if (payload.image && isExistUser.image) {
    unlinkFile(isExistUser.image);
  }

  // Remove fields that shouldn't be updated directly (e.g. id, email, etc.)
  const updatePayload: any = { ...payload };
  delete updatePayload.id;

  const updatedUser = await db.user.update({
    where: { id: numericId },
    data: updatePayload,
  });

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name ?? undefined,
    role: updatedUser.role,
    image: updatedUser.image ?? undefined,
    status: updatedUser.status,
    verified: updatedUser.verified,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
};

// Pagination - get all users
const getAllUsersFromDB = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  meta: { page: number; limit: number; total: number };
  data: Partial<IUser>[];
}> => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    db.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.user.count()
  ]);

  const data = users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    role: user.role,
    image: user.image ?? undefined,
    status: user.status,
    verified: user.verified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  return {
    meta: {
      page,
      limit,
      total
    },
    data
  };
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  getAllUsersFromDB
};
