// src/modules/azit/dtos/azit.res.dto.ts
export class AzitCreateResDto {
  /**
   * @example 1
   */
  azit_id!: number;

  /**
   * @example "즐거운 롤토체스 팟"
   */
  azit_name!: string;

  /**
   * @example "https://s3.ap-northeast-2.amazonaws.com/bucket/example.png"
   */
  azit_icon_url!: string | null;
}
