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

export class AzitListResDto {
  /**
   * @example [{ "azit_id": 1, "azit_name": "즐거운 롤토체스 팟", "azit_icon_url": "https://s3.ap-northeast-2.amazonaws.com/bucket/example.png" }, { "azit_id": 2, "azit_name": "배그 치킨 팟", "azit_icon_url": null }]
   */
  azits!: AzitCreateResDto[];
}

export class AzitMemberResDto {
    /**
     * 멤버 ID (AzitUser의 id)
     * @example 101
     */
    member_id!: number;

    /**
     * 사용자 ID
     * @example 1001
     */
    user_id!: number;

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

    /**
     * 등급 (BASIC 또는 PRO)
     * @example "PRO"
     */
    grade!: string;

    /**
     * 신뢰도 점수
     * @example 85
     */
    trust_score!: number;

    /**
     * 가입 일시
     * @example "2023-10-15T10:30:00Z"
     */
    joined_at!: Date;
}

export class PaginationResDto {
    /**
     * 현재 페이지 번호 (0부터 시작)
     * @example 0
     */
    page!: number;

    /**
     * 페이지 크기
     * @example 20
     */
    size!: number;

    /**
     * 전체 페이지 수
     * @example 1
     */
    total_pages!: number;

    /**
     * 전체 요소 수
     * @example 3
     */
    total_elements!: number;
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
     * 전체 멤버 수
     * @example 3
     */
    total_members!: number;

    /**
     * 멤버 목록
     */
    members!: AzitMemberResDto[];

    /**
     * 페이지네이션 정보
     */
    pagination!: PaginationResDto;
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
     * 사용자 ID
     * @example 1002
     */
    user_id!: number;

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

    /**
     * 등급 (BASIC 또는 PRO)
     * @example "BASIC"
     */
    grade!: string;

    /**
     * 신뢰도 점수
     * @example 72
     */
    trust_score!: number;

    /**
     * 가입 일시
     * @example "2025-01-09T10:30:00Z"
     */
    joined_at!: Date;
}