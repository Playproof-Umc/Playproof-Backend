import { CommunityTargetType } from "../types/community-type";

/**
 * 좋아요 토글 요청 DTO
 */
export class CommunityLikeReqDto {
  target_type!: CommunityTargetType;
  target_id!: number;
}

/**
 * 댓글 작성 요청 DTO
 */
export class CommunityCommentCreateReqDto {
  target_type!: CommunityTargetType;
  target_id!: number;
  parent_id?: number;
  content!: string;
}

/**
 * 댓글 수정 요청 DTO
 */
export class CommunityCommentUpdateReqDto {
  content!: string;
}