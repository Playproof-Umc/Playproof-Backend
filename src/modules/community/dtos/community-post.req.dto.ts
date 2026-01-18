import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// 1. 미디어 구조
export class CommunityMediaDto {
  @IsString()
  @IsNotEmpty()
  media_url!: string;

  @IsNumber()
  @IsNotEmpty()
  order!: number;
}

// 2. 게시글 생성
export class CommunityPostCreateReqDto {
  @IsNumber()
  @IsNotEmpty({ message: "게임 ID는 필수입니다." })
  game_id!: number;

  @IsString()
  @IsNotEmpty({ message: "제목을 입력해주세요." })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: "내용을 입력해주세요." })
  content!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommunityMediaDto)
  medias?: CommunityMediaDto[];
}

// 3. 게시글 수정
export class CommunityPostUpdateReqDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommunityMediaDto)
  medias?: CommunityMediaDto[];
}