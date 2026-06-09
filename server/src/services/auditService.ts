import { Request } from 'express';
import { AuditLog } from '../models';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const SYSTEM_USER_EMAIL = 'system@smartcomedor.local';

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

export const logSystemAction = async (
  action: string,
  details?: string,
  req?: Request,
  userId?: string,
  userEmail?: string
): Promise<void> => {
  await logAction(
    userId ?? SYSTEM_USER_ID,
    userEmail ?? SYSTEM_USER_EMAIL,
    action,
    details,
    req
  );
};
