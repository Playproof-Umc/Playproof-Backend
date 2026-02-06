// src/modules/user/dtos/user.req.dto.ts
export class UserSignUpResDto {
  /** 
   * @example 1
   */
  id!: number;

  /**
   * @example "010-1234-5678"
   */
  phone!: string | null;

  /**
   * @example "홍길동"
   */
  nickname!: string | null;
}

export class UserUpdateResDto {
  /** 
   * @example 1
   */
  id!: number;

  /**
   * @example "010-1234-5678"
   */
  phone!: string | null;

  /**
   * @example "이순신"
   */
  nickname!: string | null;
}

export class FeedbackTagResDto {
  /**
   * @example 1
   */
  id!: number;

  /**
   * @example "POSITIVE"
   */
  type!: 'POSITIVE' | 'NEGATIVE';
}

export class VerifiedAccountResDto {
  /**
   * @example 1
   */
  gameId!: number;

  /**
   * @example "Hide on bush#KR1"
   */
  accountId!: string | null;

  /**
   * @example 5
   */
  tierId!: number | null;

  /**
   * @example 2
   */
  positionId!: number | null;
}

export class UserGetResDto {
  /**
   * @example 1
   */
  id!: number;

  /**
   * @example "레나"
   */
  nickname!: string | null;

  /**
   * @example "https://example.com/avatar.png"
   */
  profileImageUrl!: string | null;

  /**
   * @example 40
   */
  tsRank!: number;

  /**
   * @example 88
   */
  trustScore!: number;

  /**
   * @example 90.5
   */
  positivePercentage!: number;

  /**
   * @example "MANNER"
   */
  playStyle!: string;

  /**
   * @example [1, 2, 3]
   */
  preferredCategoryIds!: number[];

  /**
   * @example [{ "id": 1, "type": "POSITIVE" }, { "id": 3, "type": "NEGATIVE" }]
   */
  feedbackTags!: FeedbackTagResDto[];

  /**
   * @example [{ "gameId": 1, "accountId": "rena#KR1", "tierId": 5, "positionId": 2 }]
   */
  verifiedAccounts!: VerifiedAccountResDto[];

  /**
   * @example [1, 2]
   */
  favoriteGameIds!: number[];
}