// src/common/config/auth.ts
import "dotenv/config";

/** Refresh token Redis TTL (초 단위). 기본 7일 */
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET is missing!"); })(),
  jwtExpiration: process.env.JWT_EXPIRATION || "2h",
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
  jwtAlgorithm: "HS256",
  passwordSaltRounds: Number(process.env.PASSWORD_SALT_ROUNDS) || 10,
  refreshTokenTTL: Number(process.env.REFRESH_TOKEN_TTL) || REFRESH_TOKEN_TTL_SECONDS,
};