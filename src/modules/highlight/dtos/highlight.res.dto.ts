// src/modules/highlight/dtos/highlight.res.dto.ts

export class HighlightMediaResDto {
  /**
   * 하이라이트 미디어 ID
   * @example 1
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
  azit_id?: number;

  /**
   * 아지트 이름
   * @example "Playproof 공식 클랜"
   */
  azit_name?: string;

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

export class HighlightListItemResDto {
  /**
   * 하이라이트 ID
   * @example 1
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
   * 하이라이트 설명
   * @example "멋진 킬 장면입니다"
   */
  content!: string | null;

  /**
   * 공개 범위
   * @example "PRIVATE"
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
   * @example 5
   */
  like_count!: number;

  /**
   * 댓글 수
   * @example 2
   */
  comment_count!: number;

  /**
   * 현재 사용자가 좋아요를 눌렀는지 여부
   * @example false
   */
  is_liked!: boolean;

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

export class HighlightListPaginationResDto {
  /**
   * 다음 페이지 존재 여부
   * @example true
   */
  has_next!: boolean;

  /**
   * 다음 커서 (마지막 하이라이트의 highlight_id, 더 이상 데이터가 없으면 null)
   * @example 5003
   */
  next_cursor!: number | null;

  /**
   * 가져온 항목 수
   * @example 20
   */
  limit!: number;
}

export class GetHighlightListResDto {
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
   * 하이라이트 목록
   */
  highlights!: HighlightListItemResDto[];

  /**
   * 페이지네이션 정보
   */
  pagination!: HighlightListPaginationResDto;
}

/** 마이페이지 - 내가 쓴 하이라이트 목록 아이템 (아지트 정보 포함) */
export class MyHighlightListItemResDto extends HighlightListItemResDto {
  /** 아지트 ID (커뮤니티 직접 등록 시 null) */
  azit_id?: number | null;
  /** 아지트 이름 */
  azit_name?: string | null;
}

/** 마이페이지 - 내가 쓴 하이라이트 목록 응답 */
export class GetMyHighlightListResDto {
  highlights!: MyHighlightListItemResDto[];
  pagination!: HighlightListPaginationResDto;
}

export class GetHighlightDetailResDto {
  /**
   * 하이라이트 ID
   * @example 1
   */
  highlight_id!: number;

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
   * 하이라이트 설명
   * @example "멋진 킬 장면입니다"
   */
  content!: string | null;

  /**
   * 공개 범위
   * @example "PRIVATE"
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
   * @example 5
   */
  like_count!: number;

  /**
   * 댓글 수
   * @example 2
   */
  comment_count!: number;

  /**
   * 현재 사용자가 좋아요를 눌렀는지 여부
   * @example false
   */
  is_liked!: boolean;

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

export class HighlightDeleteResDto {
  /**
   * 하이라이트 ID
   * @example 5001
   */
  highlight_id!: number;

  /**
   * 아지트 ID
   * @example 1
   */
  azit_id!: number;

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
   * 하이라이트 설명
   * @example "멋진 킬 장면입니다"
   */
  content!: string | null;

  /**
   * 삭제 일시
   * @example "2025-01-09T16:30:00Z"
   */
  deleted_at!: Date;

  /**
   * 미디어 개수
   * @example 2
   */
  media_count!: number;
}

export class HighlightLikeResDto {
  /**
   * 하이라이트 ID
   * @example 1
   */
  highlight_id!: number;

  /**
   * 아지트 ID
   * @example 1
   */
  azit_id!: number;

  /**
   * 멤버 ID
   * @example 102
   */
  member_id!: number;

  /**
   * 사용자 ID
   * @example 1002
   */
  user_id!: number;

  /**
   * 닉네임
   * @example "길동"
   */
  nickname!: string | null;

  /**
   * 좋아요 누른 일시
   * @example "2025-01-09T16:45:00Z"
   */
  liked_at!: Date;

  /**
   * 좋아요 수 
   * @example 6
   */
  like_count!: number;

  /**
   * 좋아요 여부
   * @example true
   */
  is_liked!: boolean;
}

export class HighlightUnlikeResDto {
  /**
   * 하이라이트 ID
   * @example 1
   */
  highlight_id!: number;

  /**
   * 아지트 ID
   * @example 1
   */
  azit_id!: number;

  /**
   * 멤버 ID
   * @example 102
   */
  member_id!: number;

  /**
   * 사용자 ID
   * @example 1002
   */
  user_id!: number;

  /**
   * 닉네임
   * @example "길동"
   */
  nickname!: string | null;

  /**
   * 좋아요 취소 일시
   * @example "2025-01-09T17:00:00Z"
   */
  unliked_at!: Date;

  /**
   * 좋아요 수
   * @example 5
   */
  like_count!: number;

  /**
   * 좋아요 여부
   * @example false
   */
  is_liked!: boolean;
}
