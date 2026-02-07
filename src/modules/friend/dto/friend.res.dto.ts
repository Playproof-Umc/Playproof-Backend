import { FriendStatus } from '@prisma/client/default';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsString,
} from 'class-validator/types/decorator/decorators';

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

export class FriendItemResDto {
  /**
   * 친구 사용자 ID
   * @example 1
   */
  @IsNumber()
  userId!: number;

  /**
   * 친구 닉네임
   * @example "John Doe"
   */
  @IsString()
  nickname!: string | null;

  /**
   * 친구 아바타 URL
   * @example "https://example.com/avatar.png"
   */
  @IsString()
  avatarUrl!: string | null;

  /**
   * 상태 메시지
   * @example "Hello, I'm John Doe"
   */
  @IsString()
  statusMessage!: string | null;

  /**
   * 친구 TS 점수
   * @example 100
   */
  @IsNumber()
  trustScore!: number;

  /**
   * 친구 수락일
   * @example "2026-01-01T00:00:00.000Z"
   */
  @IsDate()
  friendAt!: Date;
}

export class FriendListResDto {
  /**
   * 친구 목록
   * @example [{ id: 1, name: 'John Doe' }]
   */
  @IsArray()
  friends!: FriendItemResDto[];
}

export class FriendAcceptResDto {
  requestId!: number;
}