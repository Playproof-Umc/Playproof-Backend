import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// 1. 미디어 구조
export class CommunityHighlightMediaDto {
  @IsString()
  @IsNotEmpty()
  media_url!: string;

  @IsNumber()
  @IsNotEmpty()
  order!: number;
}

// 2. 하이라이트 생성 요청 DTO
export class CommunityHighlightCreateReqDto {
  @IsOptional()
  @IsNumber()
  azit_id?: number; // 아지트에서 생성 시 필요

  @IsString()
  @IsNotEmpty({ message: "내용을 입력해주세요." })
  content!: string;

  @IsBoolean()
  // @IsNotEmpty()는 boolean값 false를 누락으로 판단할 수 있으므로 주의가 필요합니다.
  is_public!: boolean; 

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommunityHighlightMediaDto)
  medias?: CommunityHighlightMediaDto[];
}

// 3. 하이라이트 수정 요청 DTO
export class CommunityHighlightUpdateReqDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommunityHighlightMediaDto)
  medias?: CommunityHighlightMediaDto[];
}