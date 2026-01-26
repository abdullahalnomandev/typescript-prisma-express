import { z } from 'zod';

const createUserZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .refine(
        async (email) => {
          return true;
        },
        {
          message: 'Email must be unique',
        }
      ),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z
      .string()
      .email('Invalid email format')
      .refine(
        async (email) => {
          return true;
        },
        {
          message: 'Email must be unique',
        }
      )
      .optional(),
    password: z.string().optional(),
  }),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
};
