import { CommunityHighlightRepository } from "../repositories/community-highlight.repository";
import { notFound, forbidden, Result } from "../../../common/types/result.type";
import { HighlightErrorCode } from "../../../common/constants/error-code";

export class CommunityHighlightValidator {
  // 1. 하이라이트 존재 여부 검증
  static async validateHighlight(
    repository: CommunityHighlightRepository,
    highlightId: bigint,
    userId: bigint | null
  ): Promise<{ highlight?: any; error?: Result<any> }> {
    const highlight = await repository.findHighlightById(highlightId, userId);

    if (!highlight) {
      return {
        error: notFound({
          message: "하이라이트를 찾을 수 없습니다.",
          errorCode: HighlightErrorCode.NOT_FOUND
        })
      };
    }

    return { highlight };
  }

  // 2. 하이라이트 권한 검증 (수정/삭제용)
  static async checkHighlightOwnership(
    repository: CommunityHighlightRepository,
    highlightId: bigint,
    userId: bigint | null
  ): Promise<{ highlight?: any; error?: Result<any> }> {
    const { highlight, error } = await this.validateHighlight(repository, highlightId, userId);
    if (error) return { error };

    if (highlight.userId !== userId) {
      return {
        error: forbidden({
          message: "해당 권한이 없습니다.",
          errorCode: HighlightErrorCode.UPDATE_FORBIDDEN
        })
      };
    }

    return { highlight };
  }

  // 3. 하이라이트 접근 권한 검증 (상세 조회용)
  static async checkHighlightAccess(
    repository: CommunityHighlightRepository,
    highlightId: bigint,
    userId: bigint | null
  ): Promise<{ highlight?: any; error?: Result<any> }> {
    const { highlight, error } = await this.validateHighlight(repository, highlightId, userId);
    if (error) return { error };

    // 🚩 1단계: 전체 공개글이라면 로그인 여부 상관없이 통과
    if (highlight.isPublic) return { highlight };

    // 🚩 2단계: 비공개글인데 로그인을 안 했다면 접근 거부
    if (!userId) {
      return {
        error: forbidden({
          message: "비공개 게시글에 접근 권한이 없습니다.",
          errorCode: HighlightErrorCode.LIST_FORBIDDEN
        })
      };
    }

    // 🚩 3단계: 본인이 작성한 글이라면 통과
    if (highlight.userId === userId) return { highlight };

    // 🚩 4단계: 아지트 귀속 글인 경우, 사용자가 해당 아지트 멤버인지 확인
    if (highlight.azitId) {
      const isMember = await repository.isAzitMember(highlight.azitId, userId);
      if (isMember) return { highlight };
    }

    // 🚩 5단계: 위 조건에 모두 해당하지 않는 타인의 비공개 글은 접근 거부
    return {
      error: forbidden({
        message: "아지트 멤버 또는 작성자만 볼 수 있는 게시글입니다.",
        errorCode: HighlightErrorCode.LIST_FORBIDDEN
      })
    };
  }
}