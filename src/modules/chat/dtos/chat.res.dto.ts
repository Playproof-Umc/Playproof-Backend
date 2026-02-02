import { IsNumber, IsOptional, IsString, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { ChatType } from './chat.req.dto';
import { ChatRoomRole } from '@prisma/client';

export class ChatMessageResDto {
  /**
   * @example 1
   */
  @IsNumber()
  id!: number;

  /**
   * @example 1
   */
  @IsNumber()
  chatRoomId!: number;

  /**
   * @example 1
   */
  @IsNumber()
  memberId!: number;

  /**
   * @example 1
   */
  @IsNumber()
  userId!: number;

  /**
   * @example "닉네임"
   */
  @IsOptional()
  @IsString()
  nickname?: string | null;

  /**
   * @example "안녕하세요!"
   */
  @IsString()
  content!: string;

  /**
   * @example "2025-01-01T00:00:00.000Z"
   */
  @IsString()
  createdAt!: string;
}

export class ChatMessageListResDto {
  @IsArray()
  messages!: ChatMessageResDto[];

  /**
   * @example 100
   */
  @IsOptional()
  @IsNumber()
  nextCursor!: number | null;
}

export class ChatRoomCreateResDto {
  /**
   * @example 1
   */
  @IsNumber()
  roomId!: number;
}

export class ChatRoomGetResDto {
  /**
   * @example 1
   */
  @IsNumber()
  id!: number;

  /**
   * @example "Chat Room Name"
   */
  @IsString()
  roomName!: string;

  /**
   * @example TEXT
   */
  @IsEnum(ChatType)
  chatType!: ChatType;

  /**
   * @example true
   */
  @IsBoolean()
  isPrivate!: boolean;

  /**
   * @example "2025-01-01T00:00:00.000Z"
   */
  @IsString()
  createdAt!: string;

  /**
   * @example "2025-01-01T00:00:00.000Z"
   */
  @IsString()
  updatedAt!: string;
}

export class ChatRoomInviteResDto {
  /**
   * @example 1
   * // 초대된 멤버 수
   */
  @IsNumber()
  invitations!: number;
}

export class ChatRoomMemberResDto {
  /**
   * @example 1
   */
  @IsNumber()
  id!: number;

  /**
   * @example "채나"
   */
  @IsString()
  nickname!: string | null;

  /**
   * @example "https://example.com/avatar/1.png"
   */
  @IsString()
  avatarUrl!: string | null;

  /**
   * @example "MEMBER"
   */
  @IsEnum(ChatRoomRole)
  role!: ChatRoomRole;
}