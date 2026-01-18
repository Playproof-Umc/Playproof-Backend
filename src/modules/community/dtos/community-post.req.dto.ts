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
  /** @example 10 */
  @IsNumber()
  @IsNotEmpty({ message: "카테고리 선택은 필수입니다." })
  game_id!: number;

  /** @example "이번 주말 T1 경기 직관 가실 분!" */
  @IsString()
  @IsNotEmpty({ message: "제목을 입력해주세요." })
  title!: string;

  /** @example "강남역 근처 아지트에서 같이 봐요." */
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
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CommunityMediaDto) medias?: CommunityMediaDto[];
}

// 4. 게시글 삭제
export class CommunityPostDeleteReqDto {
  /** @example "게시글 중복 작성" */
  @IsOptional()
  @IsString()
  reason?: string;
}