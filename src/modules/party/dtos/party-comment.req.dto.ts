import { IsNotEmpty, IsString, IsOptional, IsNumber, MinLength } from "class-validator";

// 1. 댓글 작성 요청
export class CreateCommentReqDto {
  /**
   * 댓글 내용
   * @example "저도 참여하고 싶어요!"
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string;

  /**
   * 부모 댓글 ID (답글 작성 시)
   * @example 101
   */
  @IsOptional()
  @IsNumber()
  parentId?: number | null;
}

// 2. 댓글 수정 요청
export class UpdateCommentReqDto {
  /**
   * 수정할 댓글 내용
   * @example "수정된 댓글 내용입니다."
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string;
}