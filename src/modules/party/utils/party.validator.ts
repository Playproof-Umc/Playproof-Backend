import { PartyRepository } from "../repository/party.repository";
import { PartyCommentRepository } from "../repository/party-comment.repository";
import { notFound, forbidden, Result } from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";

export class PartyValidator {
  // 1. 파티 게시글 존재 여부 검증
  static async validateParty(repository: PartyRepository, postId: number): Promise<{ party?: any; error?: Result<any> }> {
    const party = await repository.findPartyPostByPostId(postId);
    if (!party) {
      return { 
        error: notFound({ message: "파티를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND }) 
      };
    }
    return { party };
  }

  // 2. 파티 권한 검증
  static async checkPartyOwnership(repository: PartyRepository, postId: number, userId: number): Promise<{ party?: any; error?: Result<any> }> {
    const { party, error } = await this.validateParty(repository, postId);
    if (error) return { error };

    if (Number(party.userId) !== userId) {
      return { 
        error: forbidden({ message: "해당 권한이 없습니다.", errorCode: PartyErrorCode.FORBIDDEN }) 
      };
    }
    return { party };
  }

  // 3. 댓글 존재 및 권한 검증
  static async validateCommentOwnership(repository: PartyCommentRepository, commentId: number, userId: number): Promise<{ comment?: any; error?: Result<any> }> {
    const comment = await repository.findById(commentId);
    if (!comment) {
      return { 
        error: notFound({ message: "댓글을 찾을 수 없습니다.", errorCode: PartyErrorCode.COMMENT_NOT_FOUND }) 
      };
    }

    if (Number(comment.userId) !== userId) {
      return { 
        error: forbidden({ message: "댓글에 대한 권한이 없습니다.", errorCode: PartyErrorCode.COMMENT_FORBIDDEN }) 
      };
    }
    return { comment };
  }

  // 4. 마스터 데이터 검증
  static async validateMasterData(
    repository: PartyRepository,
    data: { gameId?: number; tierId?: number; positionIds?: number[] }
  ): Promise<Result<any> | null> {
    if (data.gameId) {
      const game = await repository.findGameById(data.gameId);
      if (!game) return notFound({ message: "게임을 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND_GAME });
    }
    if (data.tierId) {
      const tier = await repository.findTierById(data.tierId);
      if (!tier) return notFound({ message: "티어를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND_TIER });
    }
    if (data.positionIds && data.positionIds.length > 0) {
      const positions = await repository.findPositionsByIds(data.positionIds);
      if (!positions || positions.length !== data.positionIds.length) {
        return notFound({ message: "일부 포지션을 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND_POSITION });
      }
    }
    return null;
  }
}