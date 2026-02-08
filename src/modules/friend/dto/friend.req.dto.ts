import { IsNumber } from "class-validator";

export class FriendRequestReqDto {
  /**
   * 친구 요청할 사용자 ID
   * @example 1
   */
  @IsNumber()
  toUserId!: number;
}