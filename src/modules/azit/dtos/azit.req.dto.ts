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
   * 커서 (마지막으로 받은 닉네임, 첫 요청 시 생략)
   * @example "채나"
   */
  @IsOptional()
  @IsString()
  cursor?: string;

  /**
   * 가져올 항목 수 (최소 1, 최대 100)
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