// 1. 게시글 상세 응답
export class CommunityPostResDto {
  /** @example 125 */
  post_id!: number;

  /** @example 105 */
  user_id!: number;

  /** @example "유시영" */
  nickname!: string;

  /** @example 10 */
  game_id!: number;

  /** @example "이번 주말 직관 가실 분!" */
  title!: string;

  /** @example "강남역 아지트에서 같이 봐요." */
  content!: string;

  medias!: {
    media_url: string;
    order: number;
  }[];

  /** @example 5 */
  comment_count!: number;

  /** @example 12 */
  like_count!: number;

  /** @example "2026-01-18T13:30:00" */
  created_at!: string;

  /** @example "2026-01-18T13:30:00" */
  updated_at!: string;
}

// 2. 게시글 목록 응답
export class CommunityPostListResDto {
  posts!: CommunityPostResDto[];
  
  meta!: {
    total_count: number;
    current_page: number;
    total_pages: number;
  };
}

// 3. 등록 결과 응답
export class CommunityPostCreateResDto {
  /** @example 125 */
  post_id!: number;

  /** @example "게시글이 성공적으로 등록되었습니다." */
  message!: string;
}

// 4. 수정 결과 응답
export class CommunityPostUpdateResDto {
  /** @example 125 */
  post_id!: number;

  /** @example "게시글이 성공적으로 수정되었습니다." */
  message!: string;
}

// 5. 삭제 결과 응답
export class CommunityPostDeleteResDto {
  /** @example 125 */
  post_id!: number;

  /** @example "게시글이 성공적으로 삭제되었습니다." */
  message!: string;
}