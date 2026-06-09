import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth';
import { logSystemAction } from '../services/auditService';

const SENSITIVE_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'token',
  'refreshToken',
  'twoFactorCode',
  'twoFactorToken',
]);

const sanitizePayload = (payload: unknown): unknown => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item));
  }

  const result: Record<string, unknown> = {};
  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = '[REDACTED]';
      return;
    }
    result[key] = sanitizePayload(value);
  });
  return result;
};

export const auditHttpEvents = (req: AuthRequest, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const elapsedMs = Date.now() - startedAt;
    const safeBody = sanitizePayload(req.body);
    const details = JSON.stringify({
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      elapsedMs,
      role: req.user?.role ?? 'anonymous',
      query: req.query,
      body: safeBody,
    });

    const action = `HTTP_${req.method}`;
    logSystemAction(action, details, req, req.user?.id, req.user?.email).catch(() => {});
  });

  next();
};
