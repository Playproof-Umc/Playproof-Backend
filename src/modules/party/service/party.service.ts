import { injectable, inject } from "tsyringe";
import { PartyRepository } from "../repository/party.repository";
import { Result, created, notFound, ok } from "../../../common/types/result.type";
import { PartyCreateReqDto } from "../dtos/party.req.dto";
import { PartyCreateResDto, PartyGetResDto } from "../dtos/party.res.dto";
import { PartyErrorCode } from "../../../common/constants/error-code";
import { prisma } from "../../../common/config/database";

@injectable()
export class PartyService {
  constructor(
    @inject(PartyRepository) private partyRepository: PartyRepository,
  ) {}

  async createParty(dto: PartyCreateReqDto, userId: number): Promise<Result<PartyCreateResDto>> {  
    const { azitName, azitIconUrl, ...rest } = dto;

    // 1. 마스터 데이터 검증 (Game, Tier, Positions)
    const game = await this.partyRepository.findGameById(dto.gameId);
    if (!game) {
      return notFound({
        message: "게임을 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND_GAME,
      });
    }

    if (dto.tierId) {
      const tier = await this.partyRepository.findTierById(dto.tierId);
      if (!tier) {
        return notFound({
          message: "티어를 찾을 수 없습니다.",
          errorCode: PartyErrorCode.NOT_FOUND_TIER,
        });
      }
    }

    if (dto.positionIds && dto.positionIds.length > 0) {
      const positions = await this.partyRepository.findPositionsByIds(dto.positionIds);
      if (positions.length !== dto.positionIds.length) {
        return notFound({
          message: "일부 포지션을 찾을 수 없습니다.",
          errorCode: PartyErrorCode.NOT_FOUND_POSITION,
        });
      }
    }

    // 2. 아지트 및 파티 생성 (트랜잭션)
    const result = await prisma.$transaction(async (tx) => {
      // 2-1. 아지트 생성
      const tempAzit = await this.partyRepository.createTempAzit(azitName, azitIconUrl, tx);
      
      // 2-2. 파티 생성
      const party = await this.partyRepository.createParty(rest, userId, Number(tempAzit.id), tx);

      return { party, azitId: tempAzit.id };
    });

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
      azitName: dto.azitName,
      azitIconUrl: dto.azitIconUrl,
    } as PartyCreateResDto);
  }

  async getParty(id: number): Promise<Result<PartyGetResDto>> {
    const party = await this.partyRepository.findById(id);
    if (!party) {
      return notFound({
        message: "파티를 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND_PARTY,
      });
    }

    const hostAvatar = party.user.userAvatars[0]?.avatar?.avatarUrl || null;

    const tags = party.postCategories.map((pc: any) => ({
      id: Number(pc.category.id),
      name: pc.category.name,
    }));

    const positions = party.postPositions.map((pp: any) => ({
      positionId: Number(pp.position.id),
      positionName: pp.position.name,
    }));

    const response: PartyGetResDto = {
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
      currentParticipants: party.applications.length + 1, // 방장 포함
      isMic: party.isMicUse,
      status: party.recruitmentStatus,
      viewCount: Number(party.viewCount),
      tags,
      positions,
      createdAt: party.createdAt,
      updatedAt: party.updatedAt,
    };

    return ok(response);
  }
}
