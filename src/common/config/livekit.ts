// src/common/config/livekit.ts
import "dotenv/config";

export const livekitConfig = {
  url: process.env.LIVEKIT_URL || (() => { throw new Error("LIVEKIT_URL is missing!"); })(),
  apiKey: process.env.LIVEKIT_API_KEY || (() => { throw new Error("LIVEKIT_API_KEY is missing!"); })(),
  apiSecret: process.env.LIVEKIT_API_SECRET || (() => { throw new Error("LIVEKIT_API_SECRET is missing!"); })(),
};
