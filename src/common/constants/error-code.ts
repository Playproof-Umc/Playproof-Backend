// src/common/constants/error-code.ts

export const UserErrorCode = {
  NOT_FOUND: "USER_NOT_FOUND", // 유저를 찾을 수 없음
  INVALID_PASSWORD: "USER_INVALID_PASSWORD", // 비밀번호가 올바르지 않음
  UNAUTHORIZED: "USER_UNAUTHORIZED", // 인증되지 않은 사용자
	DUPLICATE_PHONE_NUMBER: "USER_DUPLICATE_PHONE_NUMBER" // 이미 존재하는 전화번호
} as const;

// 나중에 다른 도메인이 생기면 추가
// export const OrderErrorCode = { ... } as const;