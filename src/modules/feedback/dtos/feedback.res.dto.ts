import { IsNumber } from "class-validator";

export class FeedbackCreateResDto {
  /**
   * 생성된 피드백 ID
   * @example 1
   */
  @IsNumber()
  id!: number;
}



