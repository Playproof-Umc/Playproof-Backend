import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { CommunityTargetType } from "../types/community-type";

/**
 * 좋아요 토글 요청 DTO
 */
export class CommunityLikeReqDto {
  @IsEnum(CommunityTargetType)
  @IsNotEmpty({ message: "타겟 타입(POST/HIGHLIGHT)은 필수입니다." })
  target_type!: CommunityTargetType;

  @IsNumber()
  @IsNotEmpty({ message: "타겟 ID는 필수입니다." })
  target_id!: number;
}

/**
 * 댓글 작성 요청 DTO
 */
export class CommunityCommentCreateReqDto {
  @IsEnum(CommunityTargetType)
  @IsNotEmpty({ message: "타겟 타입은 필수입니다." })
  target_type!: CommunityTargetType;

  @IsNumber()
  @IsNotEmpty({ message: "타겟 ID는 필수입니다." })
  target_id!: number;

  @IsOptional()
  @IsNumber()
  parent_id?: number;

  @IsString()
  @IsNotEmpty({ message: "댓글 내용을 입력해주세요." })
  content!: string;
}

/**
 * 댓글 수정 요청 DTO
 */
export class CommunityCommentUpdateReqDto {
  @IsString()
  @IsNotEmpty({ message: "수정할 내용을 입력해주세요." })
  content!: string;
}