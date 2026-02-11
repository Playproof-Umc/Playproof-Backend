import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';

/**
 * Optional JWT 인증 미들웨어.
 * Authorization 헤더에 유효한 토큰이 있으면 req.user를 설정하고,
 * 없거나 유효하지 않으면 그냥 통과 (401 없음).
 */
export function optionalAuthMiddleware(
  req: Request & { user?: { id: number } },
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next();
  }

  jose
    .jwtVerify(token, new TextEncoder().encode(secret))
    .then(({ payload }) => {
      const userId = payload.userId;
      if (typeof userId === 'number') {
        req.user = { id: userId };
      } else if (typeof userId === 'string') {
        req.user = { id: parseInt(userId, 10) };
      }
      next();
    })
    .catch(() => next());
}
