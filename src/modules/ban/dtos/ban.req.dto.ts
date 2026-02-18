// src/modules/ban/dtos/ban.req.dto.ts

import { IsNumber, IsString } from "class-validator";
import { Type } from "class-transformer";

export class CreateBanReqDto {
  /** @example 2 */
  userId!: number;
  /** @example 1 */
  targetId!: number;
}

export class GetBanListReqDto {
  /** @example 1 */
  @IsNumber()
  @Type(() => Number)
  userId!: number;
}

export class DeleteBanReqDto {
  userId!: number;

  /** @example 2 */
  @IsNumber()
  @Type(() => Number)
  targetId!: number;
}

export class SearchBanReqDto {
  userId!: number;

  /** @example "레나" */
  @IsString()
  q!: string;
}