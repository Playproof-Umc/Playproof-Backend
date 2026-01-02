// src/common/auth/authentication.ts
import * as express from "express";
import * as jose from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "default_fallback_secret_key";
const SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === "jwt") {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error: any = new Error("No token provided");
      error.status = 401; 
      return Promise.reject(error);
    }

    const token = authHeader.split(" ")[1];

    try {
      const { payload } = await jose.jwtVerify(token, SECRET);
      return Promise.resolve({ id: payload.userId });
    } catch (err: any) {
      const error: any = new Error("Invalid or expired token");
      error.status = 401; 
      return Promise.reject(error);
    }
  }
}