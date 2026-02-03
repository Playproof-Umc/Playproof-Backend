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

    // 비공개 글인데 작성자가 아닌 경우 접근 거부
    if (!highlight.isPublic && highlight.userId !== userId) {
      return {
        error: forbidden({
          message: "비공개 게시글에 접근 권한이 없습니다.",
          errorCode: HighlightErrorCode.LIST_FORBIDDEN
        })
      };
    }

    return { highlight };
  }
}