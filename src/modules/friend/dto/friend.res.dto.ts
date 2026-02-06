import { FriendStatus } from "@prisma/client/default";
import { IsDate, IsEnum, IsNumber, IsString } from "class-validator/types/decorator/decorators";

export class FriendRequestResDto {
  /**
   * 친구 요청할 사용자 ID
   * @example 1
   */
  @IsNumber()
  toUserId!: number;

  /**
   * 친구 상태
   * @example "PENDING"
   */
  @IsEnum(FriendStatus)
  friendStatus!: FriendStatus;

  /**
   * 친구 일시
   * @example "2026-01-01T00:00:00.000Z"
   */
  @IsDate()
  friendAt!: Date;

  /**
   * 친구 신청 일시
   * @example "2026-01-01T00:00:00.000Z"
   */
  @IsDate()
  createdAt!: Date;
}