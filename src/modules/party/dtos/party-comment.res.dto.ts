// 1. 개별 댓글 정보 (대댓글 포함)
export class CommentItemDto {
  /**
   * 댓글 ID
   * @example 101
   */
  commentId!: number;

  /**
   * 작성자 유저 ID
   * @example 50
   */
  userId!: number;

  /**
   * 작성자 닉네임
   * @example "유시영"
   */
  nickname!: string;

  /**
   * 댓글 내용
   * @example "이 파티 아직 모집 중인가요?"
   */
  content!: string;

  /**
   * 생성 일시
   * @example "2026-01-05 15:00:00"
   */
  createdAt!: string;

  /**
   * 부모 댓글 ID (대댓글인 경우)
   * @example null
   */
  parentId!: number | null;

  /**
   * 답글 목록 (대댓글)
   */
  replies?: CommentItemDto[];
}

// 2. 댓글 목록 조회 결과
export class CommentListResDto {
  /** 댓글 목록 */
  comments!: CommentItemDto[];

  /** 페이징 정보 */
  meta!: {
    /** @example 1 */
    currentPage: number;
    /** @example 5 */
    totalPages: number;
    /** @example 48 */
    totalComments: number;
    /** @example 10 */
    limit: number;
  };
}

// 3. 댓글 액션 결과 (작성, 수정, 삭제 공통)
export class CommentActionResDto {
  /**
   * 대상 댓글 ID
   * @example 105
   */
  commentId!: number;

  /**
   * 파티 ID
   * @example 10
   */
  partyId?: number;

  /**
   * 작성자 유저 ID
   * @example 50
   */
  userId?: number;

  /**
   * 댓글 내용
   * @example "저도 참여하고 싶어요!"
   */
  content?: string;

  /**
   * 생성 일시
   * @example "2026-01-05 15:20:00"
   */
  createdAt?: string;

  /**
   * 수정 일시
   * @example "2026-01-05 15:25:00"
   */
  updatedAt?: string;

  /**
   * 결과 메시지
   * @example "댓글이 삭제되었습니다."
   */
  message?: string;

  /**
   * 삭제 일시
   * @example "2026-01-05 15:30:00"
   */
  deletedAt?: string;
}