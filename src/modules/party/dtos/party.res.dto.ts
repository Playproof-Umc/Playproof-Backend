import { IsBoolean, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

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

  /**
   * @example 1
   */
  @IsNumber()
  gameId!: number;

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
  @IsOptional()
  @IsString()
  azitName!: string | null;

  /**
   * @example 1
   */
  @IsNumber()
  azitId!: number | null;

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

  /**
   * @example 10
   */
  @IsNumber()
  likeCount!: number;

  /**
   * @example 3
   */
  @IsNumber()
  commentCount!: number;

  /**
   * 현재 사용자의 좋아요 여부 (로그인 시에만 유효, 비로그인 시 false)
   * @example false
   */
  @IsBoolean()
  isLiked!: boolean;

  /**
   * 현재 사용자의 파티 신청 여부 (로그인 시에만 유효, 비로그인 시 false)
   * @example false
   */
  @IsBoolean()
  isApplied!: boolean;

  /**
   * 현재 사용자의 신청 상태: none(미신청), pending(대기중), accepted(수락됨)
   * 로그인 시에만 유효, 비로그인 시 "none"
   * @example "none"
   */
  @IsString()
  applicationStatus!: "none" | "pending" | "accepted";

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

  @IsString()
  createdAt!: Date;
}

export class PartyDeleteResDto {
  /**
   * @example 105
   */
  @IsNumber()
  partyId!: number;

  /**
   * @example "파티가 삭제되었습니다."
   */
  @IsString()
  message!: string;

  /**
   * @example "2026-01-05 15:30:00"
   */
  @IsString()
  deletedAt!: Date;
}

export class PartyListResDto {
  /**
   * @example [
   *  {
   *    partyId: 1,
   *    host: {
   *      id: 1,
   *      nickname: "닉네임",
   *      trustScore: 50,
   *      avatarUrl: "https://example.com/avatar.png",
   *    },
   *    title: "파티 제목",
   *    memo: "파티 내용",
   *    tierName: "골드",
   *    azitName: "아지트 이름",
   *    participants: 5,
   *    currentParticipants: 2,
   *    isMic: true,
   *    status: "active",
   *    viewCount: 100,
   *    tags: [
   *      { id: 1, name: "태그명" },
   *      { id: 2, name: "태그명2" },
   *    ],
   *    positions: [
   *      { positionId: 1, positionName: "포지션명" },
   *      { positionId: 2, positionName: "포지션명2" },
   *    ],
   *    createdAt: "2026-01-05 15:30:00",
   *    updatedAt: "2026-01-05 15:30:00",
   *  },
   * ...
   * ]
   */
  @IsObject({ each: true })
  parties!: PartyGetResDto[];

  /**
   * 다음 페이지 커서 (latest: id 숫자, mostliked: "likeCount:id" 형식)
   * @example 100
   */
  @IsOptional()
  nextCursor!: number | string | null;

  /**
   * @example true
   */
  @IsBoolean()
  hasNext!: boolean;
}
