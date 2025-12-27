// src/common/middlewares/error.handler.ts
import { Request, Response, NextFunction } from "express";
import { ValidateError } from "tsoa";
import { internalServerError, badRequest } from "../types/result.type"; 

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ValidateError) {
    console.warn(`Validation Error for ${req.path}:`, err.fields);

    const response = badRequest({ errorCode: "ERR_VALIDATION", message: "유효성 검사에 실패했습니다." });
    return res.status(response.statusCode).json(response);
  }

  console.error("Unexpected Error:", err);

  const response = internalServerError();
  return res.status(response.statusCode).json(response);
};