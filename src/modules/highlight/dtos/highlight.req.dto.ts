// src/modules/highlight/dtos/highlight.req.dto.ts
import { IsString, IsEnum, IsOptional, MaxLength, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export enum HighlightVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export enum HighlightSortField {
  CREATED_AT = "created_at",
  UPDATED_AT = "updated_at",
  LIKE_COUNT = "like_count",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export class HighlightCreateReqDto {
  /**
   * 하이라이트 설명
   * @example "멋진 킬 "
   */
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "content는 500글자를 초과할 수 없습니다." })
  content?: string;

  /**
   * 공개 범위 (PUBLIC: 커뮤니티 공개, PRIVATE: 아지트 내부만)
   * @example "PUBLIC"
   */
  @IsEnum(HighlightVisibility, { message: "visibility는 PUBLIC 또는 PRIVATE만 가능합니다." })
  visibility!: HighlightVisibility;
}

export class GetHighlightListReqDto {
  /**
   * 커서 (마지막으로 받은 highlight_id, 첫 요청 시 생략)
   * @example 5001
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: "cursor는 1 이상의 숫자여야 합니다." })
  cursor?: number;

  /**
   * 가져올 항목 수 (최소 1, 최대 100)
   * @example 20
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: "limit은 1 이상이어야 합니다." })
  @Max(100, { message: "limit은 100 이하여야 합니다." })
  limit?: number = 20;

  /**
   * 정렬 기준 (created_at, updated_at, like_count)
   * @example "created_at"
   */
  @IsOptional()
  @IsEnum(HighlightSortField, {
    message: "sort는 created_at, updated_at, like_count 중 하나여야 합니다.",
  })
  sort?: HighlightSortField = HighlightSortField.CREATED_AT;

  /**
   * 정렬 방향 (ASC, DESC)
   * @example "DESC"
   */
  @IsOptional()
  @IsEnum(SortOrder, { message: "order는 ASC 또는 DESC여야 합니다." })
  order?: SortOrder = SortOrder.DESC;
}
