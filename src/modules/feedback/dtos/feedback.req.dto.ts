// src/modules/feedback/dtos/feedback.req.dto.ts
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class FeedbackCreateReqDto {
  /**
   * 피드백을 받을 대상 사용자 ID
   * @example 2
   */
  @IsNumber()
  targetId!: number;

  /**
   * 참여한 일정 ID
   * @example 1
   */
  @IsNumber()
  scheduleId!: number;

  /**
   * 긍정 카테고리 ID 배열 (최대 3개)
   * @example [1, 2, 3]
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: '긍정 피드백은 최대 3개까지 선택 가능합니다.' })
  @IsNumber({}, { each: true })
  positiveCategoryIds?: number[];

  /**
   * 부정 카테고리 ID 배열 (최대 3개)
   * @example [2, 4]
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: '부정 피드백은 최대 3개까지 선택 가능합니다.' })
  @IsNumber({}, { each: true })
  negativeCategoryIds?: number[];

  /**
   * 피드백 내용
   * @example "매너가 좋고 실력도 뛰어납니다."
   */
  @IsOptional()
  @IsString()
  content?: string;

  /**
   * 이 유저 다시 만나지 않기
   * @example false
   */
  @IsOptional()
  @IsBoolean()
  isBan?: boolean;
}
