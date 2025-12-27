import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { Request, Response, NextFunction } from "express";

export function validationMiddleware(type: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(type, req.body);
    const errors: ValidationError[] = await validate(dto);

    if (errors.length > 0) {
      const messages = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
      }));
      return res.status(400).json({ errors: messages });
    }

    req.body = dto;
    next();
  };
}
