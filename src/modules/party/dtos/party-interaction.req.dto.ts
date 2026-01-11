import { IsBoolean } from "class-validator";

// 1. 파티 참가 신청 수락 및 거절을 위한 요청 데이터
export class HandleApplicationReqDto {
  /**
   * 승낙 여부 (true: 승낙, false: 거절)
   * @example true
   */
  @IsBoolean()
  isAccepted!: boolean;
}