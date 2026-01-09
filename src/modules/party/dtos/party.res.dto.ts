import { IsBoolean, IsNumber, IsObject, IsString } from "class-validator";

export class PartyHostDto {
  /**
   * @example 1
   */
  @IsNumber()
  id!: number;
  /**
   * @example "닉네임"
   */
  @IsString()
  nickname!: string | null;
  /**
   * @example 50
   */
  @IsNumber()
  trustScore!: number;
  /**
   * @example "https://example.com/avatar.png"
   */
  @IsString()
  avatarUrl!: string | null;
}

export class PartyTagDto {
  /**
   * @example 1
   */
  @IsNumber()
  id!: number;
  /**
   * @example "태그명"
   */
  @IsString()
  name!: string;
}

export class PartyPositionDto {
  /**
   * @example 1
   */
  @IsNumber()
  positionId!: number;
  /**
   * @example "포지션명"
   */
  @IsString()
  positionName!: string;
}

export class PartyGetResDto {
  /**
   * @example 1
   */
  @IsNumber()
  partyId!: number;

  @IsObject()
  host!: PartyHostDto;

  /**
   * @example "파티 제목"
   */
  @IsString()
  title!: string;

  /**
   * @example "파티 한 줄 소개"
   */
  @IsString()
  memo!: string | null;

  /**
   * @example "골드"
   */
  @IsString()
  tierName!: string | null;

  /**
   * @example "아지트 이름"
   */
  @IsString()
  azitName!: string;

  /**
   * @example 5
   */
  @IsNumber()
  participants!: number;

  /**
   * @example 2
   */
  @IsNumber()
  currentParticipants!: number;

  /**
   * @example true
   */
  @IsBoolean()
  isMic!: boolean;

  /**
   * @example "active"
   */
  @IsString()
  status!: string;

  /**
   * @example 100
   */
  @IsNumber()
  viewCount!: number;

  @IsObject({ each: true })
  tags!: PartyTagDto[];

  @IsObject({ each: true })
  positions!: PartyPositionDto[];

  @IsString()
  createdAt!: Date;

  @IsString()
  updatedAt!: Date;
}

export class PartyCreateResDto {
  /**
   * @example 1
   */
  @IsNumber()
  partyId!: number;
  /**
   * @example 1
   */
  @IsNumber()
  userId!: number | null;
  /**
   * @example 1
   */
  @IsNumber()
  gameId!: number | null;
  /**
   * @example 1
   */
  @IsString()
  title!: string | null;
  /**
   * @example 1
   */
  @IsString()
  memo!: string | null;
  /**
   * @example 1
   */
  @IsNumber()
  recruitmentPeople!: number | null;
  /**
   * @example 1
   */
  @IsNumber()
  tierId!: number | null;
  /**
   * @example [1, 2]
   */
  @IsNumber({}, { each: true })
  positionIds!: number[] | null;
  /**
   * @example true
   */
  @IsBoolean()
  isMicUse!: boolean | null;
  /**
   * @example 1
   */
  @IsNumber()
  azitId!: number | null;
  /**
   * @example 1
   */
  @IsString()
  azitName!: string | null;
  /**
   * @example "https://example.com/azit.png"
   */
  @IsString()
  azitIconUrl!: string | null;
}