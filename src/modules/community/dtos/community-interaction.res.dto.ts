/**
 * 좋아요 결과 응답 DTO
 */
export class CommunityLikeResDto {
  is_liked!: boolean;
  like_count!: number;
  message!: string;
}

/**
 * 댓글 단건 응답 DTO
 */
export class CommunityCommentResDto {
  comment_id!: number;
  parent_id!: number | null;
  user_id!: number;
  nickname!: string;
  content!: string;
  created_at!: Date;
}

/**
 * 댓글 목록 응답 DTO
 */
export class CommunityCommentListResDto {
  comments!: CommunityCommentResDto[];
}