// src/common/constants/error-code.ts

export const UserErrorCode = {
  NOT_FOUND: 'USER_NOT_FOUND', // 유저를 찾을 수 없음
  INVALID_PASSWORD: 'USER_INVALID_PASSWORD', // 비밀번호가 올바르지 않음
  UNAUTHORIZED: 'USER_UNAUTHORIZED', // 인증되지 않은 사용자
  DUPLICATE_PHONE_NUMBER: 'USER_DUPLICATE_PHONE_NUMBER', // 이미 존재하는 전화번호
  DUPLICATE_NAME: 'USER_DUPLICATE_NAME', // 이미 존재하는 이름
} as const;

// 파티 및 매칭 관련 에러 코드
export const PartyErrorCode = {
  // 파티 공통
  NOT_FOUND: 'PARTY_NOT_FOUND', // 파티 게시글을 찾을 수 없음
  FORBIDDEN: 'PARTY_FORBIDDEN', // 파티에 대한 권한이 없음 (방장 아님 등)
  ALREADY_COMPLETED: 'PARTY_ALREADY_COMPLETED', // 이미 모집이 완료된 파티

  NOT_FOUND_GAME: 'PARTY_NOT_FOUND_GAME', // 게임을 찾을 수 없음
  NOT_FOUND_TIER: 'PARTY_NOT_FOUND_TIER', // 티어를 찾을 수 없음
  NOT_FOUND_POSITION: 'PARTY_NOT_FOUND_POSITION', // 포지션을 찾을 수 없음
  NOT_FOUND_AZIT: 'PARTY_NOT_FOUND_AZIT', // 아지트를 찾을 수 없음

  // 가입 신청(Application) 관련
  APPLICATION_NOT_FOUND: 'PARTY_APPLICATION_NOT_FOUND', // 신청 내역을 찾을 수 없음
  ALREADY_APPLIED: 'PARTY_ALREADY_APPLIED', // 이미 신청한 파티
  CANNOT_APPLY_TO_OWN_PARTY: 'PARTY_CANNOT_APPLY_TO_OWN', // 본인 파티에 본인이 신청 불가
  ALREADY_ACCEPTED: 'PARTY_ALREADY_ACCEPTED', // 이미 승낙된 신청
  PARTY_FULL: 'PARTY_RECRUITMENT_FULL', // 모집 인원이 초과됨

  // 좋아요(Like) 관련
  ALREADY_LIKED: 'PARTY_ALREADY_LIKED', // 이미 좋아요를 누른 상태
  LIKE_NOT_FOUND: 'PARTY_LIKE_NOT_FOUND', // 좋아요를 누른 적이 없음

  // 댓글(Comment) 관련 추가
  COMMENT_NOT_FOUND: "PARTY_COMMENT_NOT_FOUND", // 댓글을 찾을 수 없음
  COMMENT_FORBIDDEN: "PARTY_COMMENT_FORBIDDEN", // 댓글에 대한 권한이 없음

  // 서버 오류
  INTERNAL_SERVER_ERROR: 'SERVER_500',
} as const;

export const SmsErrorCode = {
  SEND_FAILED: 'SMS_SEND_FAILED', // SMS 발송 실패
  CERTIFICATION_MISMATCH: 'SMS_CERTIFICATION_MISMATCH', // 인증번호 불일치
  CERTIFICATION_EXPIRED: 'SMS_CERTIFICATION_EXPIRED', // 인증번호 만료
} as const;

export const AuthErrorCode = {
  ENCRYPTION_FAILED: 'PASSWORD_ENCRYPTION_ERROR', // 비밀번호 해싱 실패
  COMPARE_ERROR: 'PASSWORD_COMPARE_ERROR', // 비밀번호 일치 검사 실패
} as const;

// 파일 업로드 관련 에러 코드
export const FileUploadErrorCode = {
  S3_UPLOAD_FAILED: 'S3_UPLOAD_FAILED', // S3 파일 업로드 실패
  S3_DELETE_FAILED: 'S3_DELETE_FAILED', // S3 파일 삭제 실패
} as const;

// 아지트 관련 에러 코드
export const AzitErrorCode = {
  // 400 Bad Request
  BAD_REQUEST: {
    SCHEDULE_INVALID_TIME: 'SCHEDULE_INVALID_TIME', // 일정 시간이 유효하지 않음 (게임 시작 >= 종료)
    SCHEDULE_INVALID_RECRUITMENT_TIME: 'SCHEDULE_INVALID_RECRUITMENT_TIME', // 모집 마감 시간이 유효하지 않음 (모집 마감 >= 게임 시작)
    PARTICIPATION_RECRUITMENT_ENDED: 'PARTICIPATION_RECRUITMENT_ENDED', // 모집 마감 시간이 지남
  },

  // 403 Forbidden (접근 거부)
  FORBIDDEN: {
    ACCESS_FORBIDDEN: 'AZIT_ACCESS_FORBIDDEN', // 아지트 접근 권한 없음 (멤버 X)
    SCHEDULE_ACCESS_FORBIDDEN: 'SCHEDULE_ACCESS_FORBIDDEN', // 일정 접근 권한 없음 (해당 아지트의 일정 X)
  },

  // 403 Forbidden (권한 거부)
  DENIED: {
    UPDATE_DENIED: 'AZIT_UPDATE_DENIED', // 아지트 수정 권한 없음 (멤버장 X)
    DELETE_DENIED: 'AZIT_DELETE_DENIED', // 아지트 삭제 권한 없음 (멤버장 X)
    SCHEDULE_UPDATE_DENIED: 'SCHEDULE_UPDATE_DENIED', // 일정 수정 권한 없음 (생성자 X)
    SCHEDULE_DELETE_DENIED: 'SCHEDULE_DELETE_DENIED', // 일정 삭제 권한 없음 (생성자 X)
  },

  // 404 Not Found
  NOT_FOUND: {
    AZIT_NOT_FOUND: 'AZIT_NOT_FOUND', // 아지트를 찾을 수 없음
    USER_NOT_FOUND: 'AZIT_USER_NOT_FOUND', // 아지트 멤버 정보를 찾을 수 없음
    SCHEDULE_NOT_FOUND: 'SCHEDULE_NOT_FOUND', // 일정을 찾을 수 없음
    PARTICIPATION_NOT_FOUND: 'PARTICIPATION_NOT_FOUND', // 참여 내역을 찾을 수 없음
  },

  // 409 Conflict
  CONFLICT: {
    NAME_DUPLICATE: 'AZIT_NAME_DUPLICATE', // 이미 존재하는 아지트 이름
    PARTICIPATION_ALREADY_PARTICIPATED: 'PARTICIPATION_ALREADY_PARTICIPATED', // 이미 참여한 일정
    PARTICIPATION_MAX_PARTICIPANTS_EXCEEDED:
      'PARTICIPATION_MAX_PARTICIPANTS_EXCEEDED', // 최대 참여 인원 초과
  },
} as const;

export const CommunityErrorCode = {
  POST_NOT_FOUND: "COMMUNITY_POST_NOT_FOUND",       // 게시글을 찾을 수 없음
  GAME_NOT_FOUND: "COMMUNITY_GAME_NOT_FOUND",       // 게임 카테고리를 찾을 수 없음
  FORBIDDEN: "COMMUNITY_FORBIDDEN",                 // 작성자 권한 없음
  COMMENT_NOT_FOUND: "COMMUNITY_COMMENT_NOT_FOUND", // 댓글을 찾을 수 없음
  ALREADY_LIKED: "COMMUNITY_ALREADY_LIKED",         // 이미 좋아요를 누름
  LIKE_NOT_FOUND: "COMMUNITY_LIKE_NOT_FOUND",       // 좋아요 기록 없음
} as const;

// 하이라이트 관련 에러 코드
export const HighlightErrorCode = {
  CREATE_FORBIDDEN: "HIGHLIGHT_CREATE_FORBIDDEN", // 하이라이트 생성 권한 없음
  CREATE_FAILED: "HIGHLIGHT_CREATE_FAILED", // 하이라이트 생성 실패
  LIST_FORBIDDEN: "HIGHLIGHT_LIST_FORBIDDEN", // 하이라이트 목록 조회 권한 없음
  UPDATE_FORBIDDEN: "HIGHLIGHT_FORBIDDEN_UPDATE", // 하이라이트 수정 권한 없음
  UPDATE_FAILED: "HIGHLIGHT_UPDATE_FAILED", // 하이라이트 수정 실패
  DELETE_FORBIDDEN: "HIGHLIGHT_FORBIDDEN_DELETE", // 하이라이트 삭제 권한 없음
  DELETE_FAILED: "HIGHLIGHT_DELETE_FAILED", // 하이라이트 삭제 실패
  NOT_FOUND: "HIGHLIGHT_NOT_FOUND", // 하이라이트를 찾을 수 없음
  LIKE_ALREADY_EXISTS: "HIGHLIGHT_LIKE_ALREADY_EXISTS", // 이미 좋아요를 누른 하이라이트
  LIKE_NOT_FOUND: "HIGHLIGHT_LIKE_NOT_FOUND", // 좋아요를 추가하지 않은 하이라이트
} as const;

// 공통 에러 코드
export const CommonErrorCode = {
  RESOURCE_NOT_FOUND: "COMMON_RESOURCE_NOT_FOUND", // 리소스를 찾을 수 없음
} as const;

export const ChatErrorCode = {
  ROOM_NOT_FOUND: "CHAT_ROOM_NOT_FOUND", // 채팅방을 찾을 수 없음
  AZIT_MEMBER_ONLY: "CHAT_AZIT_MEMBER_ONLY", // 아지트 멤버만 접근 가능
  MESSAGE_CREATE_FAILED: "CHAT_MESSAGE_CREATE_FAILED", // 메시지 저장 실패
} as const;

// 나중에 다른 도메인이 생기면 추가
// export const OrderErrorCode = { ... } as const;
