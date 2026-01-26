import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import db from '../../../shared/prisma';
import { IOrder } from './order.interface';

const createOrderToDB = async (
  payload: Partial<IOrder>,
  user: JwtPayload
): Promise<Partial<IOrder>> => {
  const { item } = payload;
  const userId = Number(user.id);

  if (!item) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Item is required');
  }

  // Verify user exists
  const existingUser = await db.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User does not exist');
  }

  const createdOrder = await db.order.create({
    data: {
      item: item!,
      userId,
    },
  });

  if (!createdOrder) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create order'
    );
  }

  return {
    id: createdOrder.id,
    item: createdOrder.item,
    userId: createdOrder.userId,
  };
};

const getOrderByIdFromDB = async (
  orderId: number,
  user: JwtPayload
): Promise<Partial<IOrder>> => {
  const userId = Number(user.id);

  const order = await db.order.findFirst({
    where: {
      id: orderId,
      userId, // Ensure user can only access their own orders
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  return {
    id: order.id,
    item: order.item,
    userId: order.userId,
  };
};

const getAllOrdersFromDB = async (
  user: JwtPayload,
  page: number = 1,
  limit: number = 10
): Promise<{
  meta: { page: number; limit: number; total: number };
  data: Partial<IOrder>[];
}> => {
  const userId = Number(user.id);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: {
        userId, // Filter by user's orders
      },
      skip,
      take: limit,
      orderBy: [{ id: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    db.order.count({
      where: {
        userId,
      },
    }),
  ]);

  const data = orders.map((order) => ({
    id: order.id,
    item: order.item,
    userId: order.userId,
  }));

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
};

const updateOrderToDB = async (
  orderId: number,
  payload: Partial<IOrder>,
  user: JwtPayload
): Promise<Partial<IOrder>> => {
  const userId = Number(user.id);

  // Check if order exists and belongs to user
  const existingOrder = await db.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!existingOrder) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  // Remove fields that shouldn't be updated
  const updatePayload: any = { ...payload };
  delete updatePayload.id;
  delete updatePayload.userId; // Prevent changing order ownership

  const updatedOrder = await db.order.update({
    where: { id: orderId },
    data: updatePayload,
  });

  return {
    id: updatedOrder.id,
    item: updatedOrder.item,
    userId: updatedOrder.userId,
  };
};

const deleteOrderFromDB = async (
  orderId: number,
  user: JwtPayload
): Promise<void> => {
  const userId = Number(user.id);

  // Check if order exists and belongs to user
  const existingOrder = await db.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!existingOrder) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  await db.order.delete({
    where: { id: orderId },
  });
};

export const OrderService = {
  createOrderToDB,
  getOrderByIdFromDB,
  getAllOrdersFromDB,
  updateOrderToDB,
  deleteOrderFromDB,
};

