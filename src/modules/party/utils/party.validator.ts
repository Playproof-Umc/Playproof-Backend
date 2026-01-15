import { PartyRepository } from "../repository/party.repository";
import { notFound, forbidden, Result } from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";

export class PartyValidator {
  // 1-1. 파티 존재 및 권한 검증
  static async checkPartyOwnership(
    repository: PartyRepository,
    partyId: number,
    userId: number
  ): Promise<{ party?: any; error?: Result<any> }> {
    const party = await repository.findById(partyId);
    if (!party) {
      return { 
        error: notFound({ message: "파티를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND }) 
      };
    }

    if (Number(party.userId) !== userId) {
      return { 
        error: forbidden({ message: "해당 권한이 없습니다.", errorCode: PartyErrorCode.FORBIDDEN }) 
      };
    }

    return { party };
  }

  // 1-2. 게임 및 마스터 데이터 존재 검증
  static async validateMasterData(
    repository: PartyRepository,
    data: { gameId?: number; tierId?: number; positionIds?: number[] }
  ): Promise<Result<any> | null> {
    // 게임 검증
    if (data.gameId) {
      const game = await repository.findGameById(data.gameId);
      if (!game) return notFound({ message: "게임을 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND_GAME });
    }

    // 티어 검증
    if (data.tierId) {
      const tier = await repository.findTierById(data.tierId);
      if (!tier) return notFound({ message: "티어를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND_TIER });
    }

    // 포지션 검증
    if (data.positionIds && data.positionIds.length > 0) {
      const positions = await repository.findPositionsByIds(data.positionIds);
      if (!positions || positions.length !== data.positionIds.length) {
        return notFound({ message: "일부 포지션을 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND_POSITION });
      }
    }

    return null;
  }
}