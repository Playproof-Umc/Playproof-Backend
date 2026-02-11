// 1. 게시글 상세 응답
export class CommunityPostResDto {
  post_id!: number;
  user_id!: number;
  nickname!: string;
  game_id!: number;
  title!: string;
  content!: string;
  medias!: {
    media_url: string;
    order: number;
  }[];
  comment_count!: number;
  like_count!: number;
  is_liked!: boolean;
  created_at!: string;
  updated_at!: string;
}

// 2. 게시글 목록 응답
export class CommunityPostListResDto {
  posts!: CommunityPostResDto[];
  /** 페이지 기반 응답용 (getPostList, getAllPostList, getBestPostList) */
  meta?: {
    total_count: number;
    current_page: number;
    total_pages: number;
  };
  /** 커서 기반 응답용 (getMyPostList) */
  nextCursor?: number | null;
  hasNext?: boolean;
}

// 3. 삭제 결과 응답
export class CommunityPostDeleteResDto {
  post_id!: number;
  message!: string;
}