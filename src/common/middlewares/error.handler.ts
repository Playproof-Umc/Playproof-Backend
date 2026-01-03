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
    const errorDetails = Object.keys(err.fields).map((key) => ({
      field: key,
      value: (req.body as any)?.[key] || (req.query as any)?.[key],
      reason: err.fields[key].message,
    }));

    const response = badRequest({ 
      message: "유효성 검사에 실패했습니다.", 
      errorCode: "VALIDATION_FAILED",
      errors: errorDetails,
    });
    return res.status(response.statusCode).json(response);
  }
  if (err.status === 401) {
    const response = unauthorized({ 
      message: err.message,
      errorCode: "UNAUTHORIZED"
     });
    return res.status(response.statusCode).json(response);
  }

  console.error("Unexpected Error:", err);
  const response = internalServerError();
  return res.status(response.statusCode).json(response);
};