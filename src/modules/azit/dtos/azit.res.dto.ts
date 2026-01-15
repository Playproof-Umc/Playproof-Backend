// src/modules/azit/dtos/azit.res.dto.ts
export class AzitResDto {
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

export class AzitListResDto {
  /**
   * @example [{ "azit_id": 1, "azit_name": "즐거운 롤토체스 팟", "azit_icon_url": "https://s3.ap-northeast-2.amazonaws.com/bucket/example.png" }, { "azit_id": 2, "azit_name": "배그 치킨 팟", "azit_icon_url": null }]
   */
  azits!: AzitResDto[];
}
