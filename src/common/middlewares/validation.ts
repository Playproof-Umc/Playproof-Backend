import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { Request, Response, NextFunction } from "express";
import { ValidateError } from "tsoa";

export function validationMiddleware(type: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const data = { ...req.params, ...req.query, ...req.body };

    const dto = plainToInstance(type, data, {
      enableImplicitConversion: true,
    });
    
    const errors: ValidationError[] = await validate(dto);

    if (errors.length > 0) {
      const fields: any = {};
      errors.forEach((err) => {
        const constraints = err.constraints ? Object.values(err.constraints) : [];
        fields[err.property] = {
          message: constraints[0] || "Invalid value",
          value: data[err.property],
        };
      });

      // globalErrorHandler로 에러를 던짐
      return next(new ValidateError(fields, "Validation failed"));
    }

    req.body = dto;
    next();
  };
}