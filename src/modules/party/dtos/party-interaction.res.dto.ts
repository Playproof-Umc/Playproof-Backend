// 1. 파티 참가 신청 성공 시 반환되는 데이터
export class ApplyPartyResDto {
  /**
   * 생성된 신청 ID
   * @example 1
   */
  applicationId!: number;

  /**
   * 결과 메시지
   * @example "신청이 완료되었습니다."
   */
  message!: string;
}

// 2. 좋아요 토글 성공 시 반환되는 데이터
export class ToggleLikeResDto {
  /**
   * 현재 좋아요 상태
   * @example true
   */
  isLiked!: boolean;

  /**
   * 결과 메시지
   * @example "좋아요 성공"
   */
  message!: string;
}

// 3. 일반적인 결과 메시지만 반환하는 데이터 (취소 등)
export class InteractionMessageResDto {
  /**
   * 결과 메시지
   * @example "처리가 완료되었습니다."
   */
  message!: string;
}