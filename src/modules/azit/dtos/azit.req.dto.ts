// src/modules/azit/dtos/azit.req.dto.ts
import { IsString, MinLength } from "class-validator";

export class AzitCreateReqDto {
  /**
   * @example "즐거운 롤토체스 팟"
   */
  @IsString()
  @MinLength(2)
  azit_name!: string;
}