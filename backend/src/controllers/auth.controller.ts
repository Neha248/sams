import { Request, Response } from 'express';
import User from '../models/User.model';
import { loginSchema } from '../validators/auth.validator';
import { signToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.errors);
      return;
    }
    const { userId, password, role } = parsed.data;

    const user = await User.findOne({ userId, role }).select('+password');
    if (!user) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }
    if (!user.isActive) {
      sendError(res, 'Account deactivated. Contact admin.', 403);
      return;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const token = signToken({ id: user._id.toString(), role: user.role });

    sendSuccess(res, {
      token,
      user: {
        id: user._id,
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    }, 'Login successful');
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

export const getMe = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, user);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

export const logout = (_req: Request, res: Response): void => {
  sendSuccess(res, null, 'Logged out successfully');
};
