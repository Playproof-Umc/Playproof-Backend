// src/modules/ban/dtos/ban.res.dto.ts

export class CreateBanResDto {
  /** @example 1 */
  id!: number;
  /** @example 2 */
  userId!: number;
  /** @example 1 */
  targetId!: number;
  /** @example "2026-02-10T00:00:00.000Z" */
  banAt!: Date;
}

export class BanUserResDto {
  /** @example 2 */
  userId!: number;
  /** @example "레나" */
  nickname!: string;
  /** @example "상태메세지" */
  statusMessage!: string | null;
  /** @example "https://..." */
  avatarUrl!: string | null;
}

export class BanItemResDto {
  /** @example 1 */
  banId!: number;
  targetUser!: BanUserResDto;
  /** @example "2026-02-10T00:00:00.000Z" */
  banAt!: Date;
}

export class GetBanListResDto {
  bans!: BanItemResDto[];
}

export class DeleteBanResDto {
  /** @example "차단이 해제되었습니다." */
  message!: string;
}

export class SearchBanResDto {
  bans!: BanItemResDto[];
}