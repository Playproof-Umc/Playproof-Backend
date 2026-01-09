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

// 4. 참가 신청 취소 성공 응답 데이터
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