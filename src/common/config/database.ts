// src/common/config/database.ts
import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const redisClient = createClient({
  url: process.env.REDIS_URL, 
});

// 에러 핸들링
redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

// 연결 성공 로그 
redisClient.on("connect", () => {
  console.log("✅ Redis Client Connected");
});