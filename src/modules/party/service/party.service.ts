import { injectable, inject } from "tsyringe";
import { PartyRepository } from "../repository/party.repository";
import { Result, created, notFound, ok, forbidden, internalServerError } from "../../../common/types/result.type";
import { PartyCreateReqDto, PartyUpdateReqDto, PartyListReqDto } from "../dtos/party.req.dto";
import { PartyCreateResDto, PartyGetResDto, PartyDeleteResDto, PartyListResDto } from "../dtos/party.res.dto";
import { PartyErrorCode } from "../../../common/constants/error-code";
import { prisma } from "../../../common/config/database";

@injectable()
export class PartyService {
  constructor(
    @inject(PartyRepository) private partyRepository: PartyRepository,
  ) {}

  // 1. 마스터 데이터 검증용 헬퍼 (private)
  private async validateGame(gameId: number) {
    const game = await this.partyRepository.findGameById(gameId);
    if (!game) {
      return notFound({
        message: "게임을 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND_GAME,
      });
    }
    return null;
  }

  private async validateTier(tierId: number) {
    if (tierId) {
      const tier = await this.partyRepository.findTierById(tierId);
      if (!tier) {
        return notFound({
          message: "티어를 찾을 수 없습니다.",
          errorCode: PartyErrorCode.NOT_FOUND_TIER,
        });
      }
    }
    return null;
  }

  private async validatePositions(positionIds: number[]) {
    if (positionIds && positionIds.length > 0) {
      const positions = await this.partyRepository.findPositionsByIds(positionIds);
      if (!positions || positions.length !== positionIds.length) {
        return notFound({
          message: "일부 포지션을 찾을 수 없습니다.",
          errorCode: PartyErrorCode.NOT_FOUND_POSITION,
        });
      }
    }
    return null;
  }

  // 2. 파티 생성 (createParty)
  async createParty(dto: PartyCreateReqDto, userId: number): Promise<Result<PartyCreateResDto>> {  
    const { azitName, azitIconUrl, azitId, ...rest } = dto;

    // 💡 마스터 데이터 검증 및 즉시 반환 (TypeError 방지 핵심)
    const gameError = await this.validateGame(dto.gameId);
    if (gameError) return gameError;

    const tierError = await this.validateTier(dto.tierId);
    if (tierError) return tierError;

    const posError = await this.validatePositions(dto.positionIds);
    if (posError) return posError;

    // 💡 아지트 검증
    let finalAzitName: string;
    let finalAzitIconUrl: string | null;

    if (azitId) {
      const azit = await this.partyRepository.findAzitById(azitId);
      if (!azit) {
        return notFound({
          message: "아지트를 찾을 수 없습니다.",
          errorCode: PartyErrorCode.NOT_FOUND_AZIT,
        });
      }
      finalAzitName = azit.azitName;
      finalAzitIconUrl = azit.imageUrl;
    } else {
      if (!azitName || !azitIconUrl) {
        return notFound({
          message: "아지트 이름과 아이콘 URL이 필요합니다.",
          errorCode: PartyErrorCode.NOT_FOUND_AZIT,
        });
      }
      finalAzitName = azitName;
      finalAzitIconUrl = azitIconUrl;
    }

    // 💡 트랜잭션 실행
    const result = await prisma.$transaction(async (tx) => {
      let currentAzitId = azitId;

      if (!currentAzitId) {
        const tempAzit = await this.partyRepository.createTempAzit(finalAzitName, finalAzitIconUrl, tx);
        currentAzitId = Number(tempAzit.id);
      }
      
      const party = await this.partyRepository.createParty(rest, userId, Number(currentAzitId), tx);
      return { party, azitId: currentAzitId };
    });

    if (!result || !result.party) {
      return internalServerError({ message: "파티 생성에 실패했습니다.", errorCode: PartyErrorCode.INTERNAL_SERVER_ERROR });
    }

    const { party } = result;
    
    return created({
      partyId: Number(party.id),
      userId: Number(party.userId),
      gameId: Number(party.gameId),
      title: party.title,
      memo: party.memo,
      recruitmentPeople: party.recruitmentPeople,
      tierId: party.tierId ? Number(party.tierId) : null,
      positionIds: dto.positionIds,
      isMicUse: party.isMicUse,
      azitId: Number(party.azitId),
      azitName: finalAzitName,
      azitIconUrl: finalAzitIconUrl,
      createdAt: party.createdAt,
    } as PartyCreateResDto);
  }

  // 3. 파티 수정 (updateParty)
  async updateParty(id: number, dto: PartyUpdateReqDto, userId: number): Promise<Result<PartyCreateResDto>> {
    const party = await this.partyRepository.findById(id);
    if (!party) {
      return notFound({ message: "파티를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND });
    }

    if (Number(party.userId) !== userId) {
      return forbidden({ message: "파티 수정 권한이 없습니다.", errorCode: PartyErrorCode.FORBIDDEN });
    }

    // 💡 수정 시 마스터 데이터 검증 및 즉시 반환
    if (dto.gameId) {
      const error = await this.validateGame(dto.gameId);
      if (error) return error;
    }

    if (dto.tierId) {
      const error = await this.validateTier(dto.tierId);
      if (error) return error;
    }

    if (dto.positionIds && dto.positionIds.length > 0) {
      const error = await this.validatePositions(dto.positionIds);
      if (error) return error;
    }

    if (dto.azitId) {
      const azit = await this.partyRepository.findAzitById(dto.azitId);
      if (!azit) {
        return notFound({ message: "아지트를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND_AZIT });
      }
    }

    await prisma.$transaction(async (tx) => {
      if (!dto.azitId && (dto.azitName || dto.azitIconUrl)) {
        await this.partyRepository.updateAzit(Number(party.azitId), dto.azitName, dto.azitIconUrl, tx);
      }
      return await this.partyRepository.updateParty(id, dto, tx);
    });

    const finalParty = await this.partyRepository.findById(id);
    if (!finalParty) {
      return notFound({ message: "파티를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND });
    }

    return ok({
      partyId: Number(finalParty.id),
      userId: Number(finalParty.userId),
      gameId: Number(finalParty.gameId),
      title: finalParty.title,
      memo: finalParty.memo,
      recruitmentPeople: finalParty.recruitmentPeople,
      tierId: finalParty.tierId ? Number(finalParty.tierId) : null,
      positionIds: dto.positionIds || finalParty.postPositions.map((pp: any) => Number(pp.positionId)),
      isMicUse: finalParty.isMicUse,
      azitId: Number(finalParty.azitId),
      azitName: finalParty.azit.azitName,
      azitIconUrl: finalParty.azit.imageUrl,
      createdAt: finalParty.createdAt,
    } as PartyCreateResDto);
  }

  // 4. 파티 삭제 (deleteParty)
  async deleteParty(id: number, userId: number): Promise<Result<PartyDeleteResDto>> {
    const party = await this.partyRepository.findById(id);
    if (!party) {
      return notFound({ message: "파티를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND });
    }

    if (Number(party.userId) !== userId) {
      return forbidden({ message: "파티 삭제 권한이 없습니다.", errorCode: PartyErrorCode.FORBIDDEN });
    }

    await prisma.$transaction(async (tx) => {
      await this.partyRepository.deleteParty(id, tx);
      const partyCount = await this.partyRepository.countPartiesByAzitId(Number(party.azitId), tx);
      if (partyCount === 0) {
        await this.partyRepository.deleteAzit(Number(party.azitId), tx);
      }
    });

    return ok({
      partyId: id,
      message: "파티가 삭제되었습니다.",
      deletedAt: new Date(),
    });
  }

  // 5. 파티 단건 조회 (getParty)
  async getParty(id: number): Promise<Result<PartyGetResDto>> {
    const party = await this.partyRepository.findById(id);
    if (!party) {
      return notFound({ message: "파티를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND });
    }
    return ok(this.mapToGetResDto(party));
  }

  // 6. 파티 목록 조회 (getParties)
  async getParties(dto: PartyListReqDto): Promise<Result<PartyListResDto>> {
    const { page, size, sort } = dto;
    const parties = await this.partyRepository.findParties(page, size, sort);
    const totalCount = await this.partyRepository.countAll();

    const mappedParties = parties.map(p => this.mapToGetResDto(p));
    
    const hasNext = page * size < totalCount;
    const nextCursor = hasNext ? page + 1 : null;

    return ok({
      parties: mappedParties,
      nextCursor,
      hasNext,
    });
  }

  // 7. 조회용 DTO 매핑 (private)
  private mapToGetResDto(party: any): PartyGetResDto {
    const hostAvatar = party.user.userAvatars[0]?.avatar?.avatarUrl || null;

    const tags = party.postCategories.map((pc: any) => ({
      id: Number(pc.category.id),
      name: pc.category.name,
    }));

    const positions = party.postPositions.map((pp: any) => ({
      positionId: Number(pp.position.id),
      positionName: pp.position.name,
    }));

    return {
      partyId: Number(party.id),
      host: {
        id: Number(party.user.id),
        nickname: party.user.nickname,
        trustScore: party.user.trustScore,
        avatarUrl: hostAvatar,
      },
      title: party.title,
      memo: party.memo,
      tierName: party.tier?.name || null,
      azitName: party.azit.azitName,
      participants: party.recruitmentPeople,
      currentParticipants: party.applications.length + 1,
      isMic: party.isMicUse,
      status: party.recruitmentStatus,
      viewCount: Number(party.viewCount),
      tags,
      positions,
      createdAt: party.createdAt,
      updatedAt: party.updatedAt,
    };
  }
}