// src/modules/azit/dtos/azit.req.dto.ts
import { IsString, MinLength, IsOptional, IsBoolean } from "class-validator";

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