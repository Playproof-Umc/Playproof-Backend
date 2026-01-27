import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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

export enum ChatType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

export class ChatRoomCreateReqDto {
  /**
   * @example "Chat Room Name"
   */
  @IsString()
  roomName: string = '';

  /**
   * @example TEXT
   */
  @IsEnum(ChatType)
  @IsOptional()
  chatType: ChatType = ChatType.TEXT;

  /**
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}

export class ChatRoomUpdateReqDto {
  /**
   * @example "Updated Chat Room Name"
   */
  @IsOptional()
  @IsString()
  roomName?: string;

  /**
   * @example false
   */
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
