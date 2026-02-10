// 1. 파티 참가 신청 성공 응답 데이터
export class ApplyPartyResDto {
  /**
   * 생성된 신청 ID
   * @example 1
   */
  applicationId!: number;

  /**
   * 파티 게시글 ID
   * @example 10
   */
  partyId!: number;

  /**
   * 신청 상태
   * @example "PENDING"
   */
  status!: "PENDING";

  /**
   * 신청 일시
   * @example "2026-01-10 01:21:00"
   */
  createdAt!: string;

  /**
   * 결과 메시지
   * @example "신청이 완료되었습니다."
   */
  message!: string;
}

// 2. 수락/거절 처리 성공 응답 데이터
export class HandleApplicationResDto {
  /**
   * 신청 ID
   * @example 1
   */
  applicationId!: number;

  /**
   * 파티 게시글 ID
   * @example 10
   */
  partyId!: number;

  /**
   * 처리 결과 상태
   * @example "APPROVED"
   */
  status!: "APPROVED" | "REJECTED";

  /**
   * 수정 일시
   * @example "2026-01-10 14:20:00"
   */
  updatedAt!: string;

  /**
   * 결과 메시지
   * @example "신청이 수락되었습니다."
   */
  message!: string;
}

// 3. 좋아요 토글 성공 응답 데이터
export class ToggleLikeResDto {
  /**
   * 파티 게시글 ID
   * @example 10
   */
  partyId!: number;

  /**
   * 좋아요 여부
   * @example true
   */
  isLiked!: boolean;

  /**
   * 결과 메시지
   * @example "좋아요 성공"
   */
  message!: string;
}

// 4. 신청자 목록 조회 - 신청자 카드 정보
export class ApplicationApplicantDto {
  /**
   * 신청자 ID
   * @example 1
   */
  id!: number;

  /**
   * 닉네임
   * @example "레나"
   */
  nickname!: string | null;

  /**
   * 아바타 URL
   * @example "https://example.com/avatar.png"
   */
  avatarUrl!: string | null;

  /**
   * 신뢰 점수 (TS)
   * @example 90
   */
  trustScore!: number;
}

// 5. 신청자 목록 조회 - 개별 신청 항목
export class ApplicationItemDto {
  /**
   * 신청 ID
   * @example 1
   */
  applicationId!: number;

  /**
   * 게임/카테고리명
   * @example "오버워치"
   */
  gameName!: string;

  /**
   * 신청자 정보
   */
  applicant!: ApplicationApplicantDto;

  /**
   * 모집 인원 (현재/전체)
   * @example "2/4"
   */
  recruitmentStatus!: string;

  /**
   * 파티 메모/설명
   * @example "경쟁다인큐 구합니다 TS 90상"
   */
  memo!: string | null;

  /**
   * 신청 일시
   * @example "2026-01-10 14:20:00"
   */
  createdAt!: string;
}

// 6. 신청자 목록 조회 응답
export class ApplicationListResDto {
  /**
   * 총 신청자 수
   * @example 11
   */
  totalCount!: number;

  /**
   * 신청자 목록
   */
  applications!: ApplicationItemDto[];
}

// 6-1. 내 전체 파티 신청 목록 - 개별 항목 (파티 정보 포함)
export class ApplicationItemWithPostDto extends ApplicationItemDto {
  /**
   * 파티 게시글 ID
   * @example 10
   */
  postId!: number;

  /**
   * 파티 제목
   * @example "경쟁다인큐 구합니다"
   */
  postTitle!: string;
}

// 6-2. 내 전체 파티 신청 목록 조회 응답
export class MyApplicationListResDto {
  /**
   * 총 신청자 수
   * @example 11
   */
  totalCount!: number;

  /**
   * 신청자 목록 (파티별 구분 가능)
   */
  applications!: ApplicationItemWithPostDto[];
}

// 7. 참가 신청 취소 성공 응답 데이터
export class InteractionMessageResDto {
  /**
   * 결과 메시지
   * @example "가입 신청이 성공적으로 취소되었습니다."
   */
  message!: string;

  /**
   * 취소된 파티 ID
   * @example 10
   */
  partyId!: number;

  /**
   * 취소 처리 일시
   * @example "2026-01-05 14:05:00"
   */
  updatedAt!: string;
}