// src/modules/azit/dtos/azit.res.dto.ts
import { Azit } from '@prisma/client';

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

  /**
   * 정적 팩토리 메서드
   * @param azit - Prisma Azit 엔티티
   * @returns AzitResDto
   */
  static from(azit: Pick<Azit, 'id' | 'azitName' | 'imageUrl'>): AzitResDto {
    return {
      azit_id: Number(azit.id),
      azit_name: azit.azitName,
      azit_icon_url: azit.imageUrl,
    };
  }
}

export class AzitListResDto {
  /**
   * @example [{ "azit_id": 1, "azit_name": "즐거운 롤토체스 팟", "azit_icon_url": "https://s3.ap-northeast-2.amazonaws.com/bucket/example.png" }, { "azit_id": 2, "azit_name": "배그 치킨 팟", "azit_icon_url": null }]
   */
  azits!: AzitResDto[];
}
