// src/modules/ban/dtos/ban.req.dto.ts

export class CreateBanReqDto {
    /** @example 2 */
    userId!: number;

    /** @example 1 */
    targetId!: number;
}