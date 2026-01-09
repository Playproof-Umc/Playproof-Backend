import { IsBoolean, IsNumber } from "class-validator";
import { Type } from "class-transformer";

// 1. 공통 ID 요청 DTO
export class PartyIdReqDto {
  @Type(() => Number)
  @IsNumber()
  id!: number;
}

// 2. 매칭 승낙/거절 요청 DTO
export class PartyApplicationHandleReqDto {
  @IsBoolean()
  isAccepted!: boolean;
}