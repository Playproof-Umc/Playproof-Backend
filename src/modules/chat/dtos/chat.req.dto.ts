import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const CHAT_MESSAGE_MAX_LENGTH = 1000;

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

export class ChatMessageCreateReqDto {
  /**
   * @example "안녕하세요!"
   */
  @IsOptional()
  @IsString()
  @MaxLength(CHAT_MESSAGE_MAX_LENGTH, {
    message: `메시지는 ${CHAT_MESSAGE_MAX_LENGTH}자를 초과할 수 없습니다.`,
  })
  content?: string;

  /**
   * 이미지 업로드 API로 받은 URL 목록 (최대 5개)
   * @example ["https://bucket.s3.region.amazonaws.com/chat/xxx.jpg"]
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  mediaUrls?: string[];
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

export class ChatRoomInviteReqDto {
  /**
   * @example [1, 2, 3]
   */
  @IsNumber({}, { each: true })
  memberIds!: number[];
}