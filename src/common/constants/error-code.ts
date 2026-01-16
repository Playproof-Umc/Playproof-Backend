// src/common/constants/error-code.ts

export const UserErrorCode = {
  NOT_FOUND: "USER_NOT_FOUND", // 유저를 찾을 수 없음
  INVALID_PASSWORD: "USER_INVALID_PASSWORD", // 비밀번호가 올바르지 않음
  UNAUTHORIZED: "USER_UNAUTHORIZED", // 인증되지 않은 사용자
	DUPLICATE_PHONE_NUMBER: "USER_DUPLICATE_PHONE_NUMBER", // 이미 존재하는 전화번호
  DUPLICATE_NAME: "USER_DUPLICATE_NAME" // 이미 존재하는 이름
} as const;

// 파티 및 매칭 관련 에러 코드
export const PartyErrorCode = {
  // 파티 공통
  NOT_FOUND: "PARTY_NOT_FOUND",           // 파티 게시글을 찾을 수 없음
  FORBIDDEN: "PARTY_FORBIDDEN",           // 파티에 대한 권한이 없음 (방장 아님 등)
  ALREADY_COMPLETED: "PARTY_ALREADY_COMPLETED", // 이미 모집이 완료된 파티
  
  NOT_FOUND_GAME: "PARTY_NOT_FOUND_GAME", // 게임을 찾을 수 없음
  NOT_FOUND_TIER: "PARTY_NOT_FOUND_TIER", // 티어를 찾을 수 없음
  NOT_FOUND_POSITION: "PARTY_NOT_FOUND_POSITION", // 포지션을 찾을 수 없음
  NOT_FOUND_AZIT: "PARTY_NOT_FOUND_AZIT", // 아지트를 찾을 수 없음
  
  // 가입 신청(Application) 관련
  APPLICATION_NOT_FOUND: "PARTY_APPLICATION_NOT_FOUND", // 신청 내역을 찾을 수 없음
  ALREADY_APPLIED: "PARTY_ALREADY_APPLIED",             // 이미 신청한 파티
  CANNOT_APPLY_TO_OWN_PARTY: "PARTY_CANNOT_APPLY_TO_OWN", // 본인 파티에 본인이 신청 불가
  ALREADY_ACCEPTED: "PARTY_ALREADY_ACCEPTED",           // 이미 승낙된 신청
  PARTY_FULL: "PARTY_RECRUITMENT_FULL",                 // 모집 인원이 초과됨
  
  // 좋아요(Like) 관련
  ALREADY_LIKED: "PARTY_ALREADY_LIKED",   // 이미 좋아요를 누른 상태
  LIKE_NOT_FOUND: "PARTY_LIKE_NOT_FOUND",   // 좋아요를 누른 적이 없음

  // 서버 오류
  INTERNAL_SERVER_ERROR: "SERVER_500",
} as const;

export const SmsErrorCode = {
  SEND_FAILED: "SMS_SEND_FAILED", // SMS 발송 실패
  CERTIFICATION_MISMATCH: "SMS_CERTIFICATION_MISMATCH", // 인증번호 불일치
  CERTIFICATION_EXPIRED: "SMS_CERTIFICATION_EXPIRED", // 인증번호 만료
} as const;

export const AuthErrorCode = {
  ENCRYPTION_FAILED: "PASSWORD_ENCRYPTION_ERROR", // 비밀번호 해싱 실패
  COMPARE_ERROR: "PASSWORD_COMPARE_ERROR", // 비밀번호 일치 검사 실패 
}

// 하이라이트 관련 에러 코드
export const HighlightErrorCode = {
  CREATE_FORBIDDEN: "HIGHLIGHT_CREATE_FORBIDDEN", // 하이라이트 생성 권한 없음
  CREATE_FAILED: "HIGHLIGHT_CREATE_FAILED", // 하이라이트 생성 실패
  NOT_FOUND: "HIGHLIGHT_NOT_FOUND", // 하이라이트를 찾을 수 없음
} as const;

// 나중에 다른 도메인이 생기면 추가
// export const OrderErrorCode = { ... } as const;
