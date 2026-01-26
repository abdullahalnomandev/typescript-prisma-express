import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { OrderService } from './order.service';

const createOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const { ...orderData } = req.body;
    console.log(user)
    const result = await OrderService.createOrderToDB(orderData, user!);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Order created successfully',
      data: result,
    });
  }
);

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid order ID',
      data: null,
    });
  }

  const result = await OrderService.getOrderByIdFromDB(orderId, user!);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const page =
    typeof req.query?.page === 'string' ? parseInt(req.query.page, 10) : 1;
  const limit =
    typeof req.query?.limit === 'string' ? parseInt(req.query.limit, 10) : 10;

  const result = await OrderService.getAllOrdersFromDB(user!, page, limit);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Orders retrieved successfully',
    data: result,
  });
});

const updateOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const { id } = req.params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Invalid order ID',
        data: null,
      });
    }

    const result = await OrderService.updateOrderToDB(
      orderId,
      req.body,
      user!
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Order updated successfully',
      data: result,
    });
  }
);

const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid order ID',
      data: null,
    });
  }

  await OrderService.deleteOrderFromDB(orderId, user!);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Order deleted successfully',
    data: null,
  });
});

export const OrderController = {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrder,
  deleteOrder,
};

