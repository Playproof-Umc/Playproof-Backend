import { IsNumber, IsOptional, Min } from "class-validator";

export class ChatMessageListReqDto {
  /**
   * @example 50
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  size?: number;

  /**
   * @example 100
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  cursor?: number;
}
