// src/common/middlewares/error.handler.ts
import { Request, Response, NextFunction } from "express";
import { ValidateError } from "tsoa";
import { internalServerError, badRequest, unauthorized } from "../types/result.type"; 

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ValidateError) {
    const errorMessages = Object.values(err.fields).map((f) => f.message);

    const combinedMessage = errorMessages.join(" / ");

    const response = badRequest({ 
      errorCode: "ERR_VALIDATION", 
      message: combinedMessage || "유효성 검사에 실패했습니다." 
    });
    return res.status(response.statusCode).json(response);
  }
  if (err.status === 401) {
    const response = unauthorized({
      message: err.message || "인증되지 않은 사용자입니다.",
      errorCode: "UNAUTHORIZED",
    });
    return res.status(response.statusCode).json(response);
  }

  console.error("Unexpected Error:", err);

  const response = internalServerError();
  return res.status(response.statusCode).json(response);
};