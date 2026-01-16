// src/modules/highlight/dtos/highlight.res.dto.ts

export class HighlightMediaResDto {
  /**
   * 하이라이트 미디어 ID
   * @example 1001
   */
  highlight_media_id!: number;

  /**
   * 미디어 URL
   * @example "https://example.com/highlights/video1.mp4"
   */
  media_url!: string;

  /**
   * 순서
   * @example 0
   */
  order!: number;

  /**
   * 업로드 일시
   * @example "2025-01-09T14:30:00Z"
   */
  upload_at!: Date;
}

export class HighlightCreateResDto {
  /**
   * 하이라이트 ID
   * @example 5001
   */
  highlight_id!: number;

  /**
   * 사용자 ID
   * @example 1001
   */
  user_id!: number;

  /**
   * 닉네임
   * @example "채나"
   */
  nickname!: string | null;

  /**
   * 아지트 ID
   * @example 1
   */
  azit_id!: number;

  /**
   * 아지트 이름
   * @example "Playproof 공식 클랜"
   */
  azit_name!: string;

  /**
   * 하이라이트 설명
   * @example "멋진 킬 장면입니다"
   */
  content!: string | null;

  /**
   * 공개 범위
   * @example "PUBLIC"
   */
  visibility!: string;

  /**
   * 미디어 개수
   * @example 2
   */
  media_count!: number;

  /**
   * 미디어 목록
   */
  medias!: HighlightMediaResDto[];

  /**
   * 좋아요 수
   * @example 0
   */
  like_count!: number;

  /**
   * 댓글 수
   * @example 0
   */
  comment_count!: number;

  /**
   * 생성 일시
   * @example "2025-01-09T14:30:00Z"
   */
  created_at!: Date;

  /**
   * 수정 일시
   * @example "2025-01-09T14:30:00Z"
   */
  updated_at!: Date;
}
