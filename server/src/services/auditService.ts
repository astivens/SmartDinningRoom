import { Request } from 'express';
import { AuditLog } from '../models';

export const logAction = async (
  userId: string,
  userEmail: string,
  action: string,
  details?: string,
  req?: Request
): Promise<void> => {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress
      : undefined;

    await AuditLog.create({ userId, userEmail, action, details, ipAddress });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};
