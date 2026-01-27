import { Socket } from 'socket.io';

// 토큰 추출
export const extractToken = (socket: Socket): string | null => {
  const authHeader = socket.handshake.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  const authToken = socket.handshake.auth?.token;
  return typeof authToken === 'string' ? authToken : null;
};

// 사용자 ID 파싱
export const parseUserId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};
