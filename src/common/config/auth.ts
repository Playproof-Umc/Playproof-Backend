// src/common/config/auth.ts
import "dotenv/config";

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET is missing!"); })(),
  jwtExpiration: process.env.JWT_EXPIRATION || "2h", 
  jwtAlgorithm: "HS256", 
  passwordSaltRounds: Number(process.env.PASSWORD_SALT_ROUNDS) || 10,
};