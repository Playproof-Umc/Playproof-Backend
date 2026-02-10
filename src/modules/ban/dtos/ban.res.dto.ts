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