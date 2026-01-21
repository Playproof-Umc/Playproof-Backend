import { IsNumber, IsOptional, IsString, IsArray } from 'class-validator';

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
