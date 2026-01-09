import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class PartyCreateReqDto {
  /**
   * @example 1
   */
  @IsNumber()
  gameId!: number;

  /**
   * @example "파티 제목"
   */
  @IsString()
  title!: string;

  /**
   * @example "파티 내용"
   */
  @IsString()
  memo!: string;

  /**
   * @example 1
   */
  @IsNumber()
  recruitmentPeople!: number;

  /**
   * @example 1
   */
  @IsNumber()
  tierId!: number;

  /**
   * @example [1, 2]
   */
  @IsNumber({}, { each: true })
  positionIds!: number[];

  /**
   * @example true
   */
  @IsBoolean()
  isMicUse!: boolean;

  /**
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  azitId?: number;

  /**
   * @example "아지트 이름"
   */
  @IsOptional()
  @IsString()
  azitName?: string;

  /**
   * @example "아지트 아이콘 URL"
   */
  @IsOptional()
  @IsString()
  azitIconUrl?: string;
}

export class PartyUpdateReqDto {
  /**
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  gameId?: number;

  /**
   * @example "수정된 파티 제목"
   */
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * @example "수정된 파티 내용"
   */
  @IsOptional()
  @IsString()
  memo?: string;

  /**
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  recruitmentPeople?: number;

  /**
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  tierId?: number;

  /**
   * @example [1, 2]
   */
  @IsOptional()
  @IsNumber({}, { each: true })
  positionIds?: number[];

  /**
   * @example true
   */
  @IsOptional()
  @IsBoolean()
  isMicUse?: boolean;

  /**
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  azitId?: number;

  /**
   * @example "수정된 아지트 이름"
   */
  @IsOptional()
  @IsString()
  azitName?: string;

  /**
   * @example "수정된 아지트 아이콘 URL"
   */
  @IsOptional()
  @IsString()
  azitIconUrl?: string;
}
