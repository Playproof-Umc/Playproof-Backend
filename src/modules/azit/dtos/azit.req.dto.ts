// src/modules/azit/dtos/azit.req.dto.ts
import { IsString, MinLength, IsOptional, IsBoolean, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class AzitCreateReqDto {
  /**
   * @example "즐거운 롤토체스 팟"
   */
  @IsString()
  @MinLength(2)
  azit_name!: string;
}

export class AzitUpdateReqDto {
  /**
   * @example "수정된 아지트 이름"
   * @example null
   */
  @IsOptional()
  @IsString()
  @MinLength(2)
  azit_name?: string | null;

  /**
   * @example true
   * @example false
   */
  @IsBoolean()
  is_delete_icon: boolean = false;
}

export class GetAzitMembersReqDto {
  /**
   * 페이지 번호 (0부터 시작)
   * @example 0
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  /**
   * 페이지당 항목 수 (최소 1)
   * @example 20
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 20;
}

export class AddAzitMemberReqDto {
  /**
   * 추가할 사용자 ID
   * @example 1
   */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id!: number;
}