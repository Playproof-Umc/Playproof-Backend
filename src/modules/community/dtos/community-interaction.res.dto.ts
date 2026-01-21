/**
 * 좋아요 결과 응답 DTO
 */
export interface CommunityLikeResDto {
  is_liked: boolean;
  like_count: number;
  message: string;
}

/**
 * 댓글 단건 응답 DTO
 */
export interface CommunityCommentResDto {
  comment_id: number;
  parent_id: number | null;
  user_id: number;
  nickname: string;
  content: string;
  created_at: Date;
}

/**
 * 댓글 목록 응답 DTO
 */
export interface CommunityCommentListResDto {
  comments: CommunityCommentResDto[];
}