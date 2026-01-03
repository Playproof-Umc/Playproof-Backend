// src/common/types/result.type.ts

/** * ------------------------------------------------------------------
 * ApiErrorDetail Interface
 * ------------------------------------------------------------------
 */

export interface ApiErrorDetail {
  field: string;
  value: any;
  reason: string;
}
/**
 * ------------------------------------------------------------------
 * Base Result Types
 * ------------------------------------------------------------------
 */

export type Failed = {
  statusCode: number;
  data: null;
  error: {
    code: string;
    message: string;
    errors?: ApiErrorDetail[]; 
  };
};

export type Success<T> = {
  statusCode: number;
  data: T;
  error?: null;
};

export type Result<T> = Success<T> | Failed;

/**
 * ------------------------------------------------------------------
 * Base Utility Functions
 * ------------------------------------------------------------------
 */

export const isSuccess = <T>(r: Result<T>): r is Success<T> => !r.error;

export const success = <T>(data: T, statusCode: number = 200): Success<T> => ({
  statusCode,
  data,
  error: null,
});

export const failed = (
  message: string,
  errorCode: string,
  statusCode: number = 400,
  errors: ApiErrorDetail[] = []
): Failed => ({
  statusCode,
  data: null,
  error: {
    code: errorCode,
    message,
    errors,
  }
});

/**
 * ------------------------------------------------------------------
 * createError Factory Function
 * ------------------------------------------------------------------
 */

export type FailedMessage<StatusCode extends number> = {
    message: string;
    errorCode: string;
    statusCode: StatusCode;
};

export type AdditionalErrorParams = {
  errors?: ApiErrorDetail[];
}

export const failedMessageBuilder = (boilerplate: FailedMessage<number>): (partialMessage?: Partial<Omit<FailedMessage<number>, "statusCode">> & AdditionalErrorParams) => Failed => {
  const { message: defaultMessage, errorCode: defaultErrorCode, statusCode } = boilerplate;
  
  return (partialMessage = {}) => failed(
    partialMessage.message ?? defaultMessage,
    partialMessage.errorCode ?? defaultErrorCode,
    statusCode,
    partialMessage.errors
  );
};

/**
 * ------------------------------------------------------------------
 * Success Helpers
 * ------------------------------------------------------------------
 */

export const ok = <T>(data: T): Success<T> => success(data, 200);

export const created = <T>(data: T): Success<T> => success(data, 201);

export const noContent = (): Success<null> => success(null, 204);

/** ------------------------------------------------------------------
 * Error Helpers
 * ------------------------------------------------------------------
 */

// 400 Bad Request
export const badRequest = failedMessageBuilder({ message: "잘못된 요청입니다.", errorCode: "ERR_400", statusCode: 400 });

// 401 Unauthorized
export const unauthorized = failedMessageBuilder({ message: "인증이 필요합니다.", errorCode: "ERR_401", statusCode: 401 });

// 403 Forbidden
export const forbidden = failedMessageBuilder({ message: "접근 권한이 없습니다.", errorCode: "ERR_403", statusCode: 403 });

// 404 Not Found
export const notFound = failedMessageBuilder({ message: "요청하신 리소스를 찾을 수 없습니다.", errorCode: "ERR_404", statusCode: 404 });

// 409 Conflict
export const conflict = failedMessageBuilder({ message: "데이터 충돌이 발생했습니다.", errorCode: "ERR_409", statusCode: 409 });

// 500 Internal Server Error
export const internalServerError = failedMessageBuilder({ message: "서버 내부 오류가 발생했습니다.", errorCode: "ERR_500", statusCode: 500 });
/** * ------------------------------------------------------------------
 * Interfaces for Swagger Documentation
 * ------------------------------------------------------------------
 */

// 400 에러 (Bad Request)
export interface BadRequestError extends Failed {
  statusCode: 400;
  /**
   * @example {
   * "code": "COMMON_INVALID_PARAMETER",
   * "message": "요청 파라미터가 잘못되었습니다.",
   * "errors": [
   * { "field": "email", "value": "invalid-email", "reason": "이메일 형식이 올바르지 않습니다." }
   * ]
   * }
   */
  error: {
    code: string;
    message: string;
    errors?: ApiErrorDetail[];
  };
}

/**
 * 401 에러 (Unauthorized)
 * @example {
 * "statusCode": 401,
 * "data": null,
 * "error": {
 * "code": "AUTH_UNAUTHORIZED",
 * "message": "인증이 필요합니다."
 * }
 * }
 */
export interface UnauthorizedError extends Failed {
  statusCode: 401;
}

/**
 * 403 에러 (Forbidden)
 * @example {
 * "statusCode": 403,
 * "data": null,
 * "error": {
 * "code": "AUTH_FORBIDDEN",
 * "message": "접근 권한이 없습니다."
 * }
 * }
 */
export interface ForbiddenError extends Failed {
  statusCode: 403;
}

/**
 * 404 에러 (Not Found)
 * @example {
 * "statusCode": 404,
 * "data": null,
 * "error": {
 * "code": "RESOURCE_NOT_FOUND",
 * "message": "요청하신 리소스를 찾을 수 없습니다."
 * }
 * }
 */
export interface NotFoundError extends Failed {
  statusCode: 404;
}

/**
 * 409 에러 (Conflict)
 * @example {
 * "statusCode": 409,
 * "data": null,
 * "error": {
 * "code": "RESOURCE_CONFLICT",
 * "message": "이미 존재하는 데이터입니다."
 * }
 * }
 */
export interface ConflictError extends Failed {
  statusCode: 409;
}

/**
 * 500 에러 (Internal Server Error)
 * @example {
 * "statusCode": 500,
 * "data": null,
 * "error": {
 * "code": "SERVER_ERROR",
 * "message": "서버 내부 오류가 발생했습니다."
 * }
 * }
 */
export interface InternalServerError extends Failed {
  statusCode: 500;
}