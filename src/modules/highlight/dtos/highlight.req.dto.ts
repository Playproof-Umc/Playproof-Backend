// src/modules/highlight/dtos/highlight.req.dto.ts
import { IsString, IsEnum, IsOptional, MaxLength } from "class-validator";

export enum HighlightVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
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
