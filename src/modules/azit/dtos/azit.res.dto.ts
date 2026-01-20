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

export class AzitMemberResDto {
  /**
   * 멤버 ID (AzitUser의 id)
   * @example 101
   */
  member_id!: number;

  /**
   * 닉네임
   * @example "채나"
   */
  nickname!: string | null;

  /**
   * 아바타 URL
   * @example "https://example.com/avatar/1.png"
   */
  avatar_url!: string | null;

  /**
   * 역할 (HOST 또는 MEMBER)
   * @example "HOST"
   */
  role!: string;
}

export class CursorPaginationResDto {
  /**
   * 다음 커서 (더 이상 데이터가 없으면 null)
   * @example 125
   */
  next_cursor!: number | null;

  /**
   * 다음 페이지 존재 여부
   * @example true
   */
  has_next!: boolean;
}

export class GetAzitMembersResDto {
  /**
   * 아지트 ID
   * @example 1
   */
  azit_id!: number;

  /**
   * 아지트 이름
   * @example "Playproof 공식 클랜"
   */
  azit_name!: string;

  /**
   * 멤버 목록
   */
  members!: AzitMemberResDto[];

  /**
   * 다음 커서 (마지막 멤버의 닉네임, 더 이상 데이터가 없으면 null)
   * @example "채나"
   */
  next_cursor!: string | null;

  /**
   * 다음 페이지 존재 여부
   * @example true
   */
  has_next!: boolean;
}

export class AddAzitMemberResDto {
  /**
   * 멤버 ID (AzitUser의 id)
   * @example 104
   */
  member_id!: number;

  /**
   * 아지트 ID
   * @example 1
   */
  azit_id!: number;

  /**
   * 닉네임
   * @example "채나"
   */
  nickname!: string | null;

  /**
   * 아바타 URL
   * @example "https://example.com/avatar/2.png"
   */
  avatar_url!: string | null;

  /**
   * 역할 (HOST 또는 MEMBER)
   * @example "MEMBER"
   */
  role!: string;
}

export class RemoveAzitMemberResDto {
  /**
   * 멤버 ID (AzitUser의 id)
   * @example 104
   */
  member_id!: number;

  /**
   * 아지트 ID
   * @example 1
   */
  azit_id!: number;

  /**
   * 닉네임
   * @example "채나"
   */
  nickname!: string | null;

  /**
   * 제거 일시
   * @example "2025-01-09T11:45:00Z"
   */
  removed_at!: Date;

  /**
   * 제거 사유 (FORCE_REMOVE: 강제 제거, SELF_LEAVE: 자진 탈퇴)
   * @example "FORCE_REMOVE"
   */
  reason!: string;
}
