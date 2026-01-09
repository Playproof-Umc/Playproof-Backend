import { injectable, inject } from "tsyringe";
import { PartyRepository } from "../repository/party.repository";
import { Result, created, notFound, ok, forbidden } from "../../../common/types/result.type";
import { PartyCreateReqDto, PartyUpdateReqDto } from "../dtos/party.req.dto";
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

  async updateParty(id: number, dto: PartyUpdateReqDto, userId: number): Promise<Result<PartyCreateResDto>> {
    // 1. 파티 존재 여부 및 권한 확인
    const party = await this.partyRepository.findById(id);
    if (!party) {
      return notFound({
        message: "파티를 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND_PARTY,
      });
    }

    if (Number(party.userId) !== userId) {
      return forbidden({
        message: "파티 수정 권한이 없습니다.",
        errorCode: PartyErrorCode.FORBIDDEN,
      });
    }

    // 2. 데이터 검증
    if (dto.gameId) {
      const game = await this.partyRepository.findGameById(dto.gameId);
      if (!game) {
        return notFound({
          message: "게임을 찾을 수 없습니다.",
          errorCode: PartyErrorCode.NOT_FOUND_GAME,
        });
      }
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

    // 3. 트랜잭션 업데이트
    const updatedParty = await prisma.$transaction(async (tx) => {
      // 아지트 정보 업데이트 (필요한 경우)
      if (dto.azitName || dto.azitIconUrl) {
        await this.partyRepository.updateAzit(
          Number(party.azitId),
          dto.azitName,
          dto.azitIconUrl,
          tx
        );
      }

      // 파티 정보 업데이트
      return await this.partyRepository.updateParty(id, dto, tx);
    });

    // 4. 결과 반환 (CreateResDto 재사용 또는 필요시 전용 DTO 생성)
    // 여기서는 기존 PartyCreateResDto의 구조를 맞춰서 반환
    return ok({
      partyId: Number(updatedParty.id),
      userId: Number(updatedParty.userId),
      gameId: Number(updatedParty.gameId),
      title: updatedParty.title,
      memo: updatedParty.memo,
      recruitmentPeople: updatedParty.recruitmentPeople,
      tierId: updatedParty.tierId ? Number(updatedParty.tierId) : null,
      positionIds: dto.positionIds || party.postPositions.map((pp: any) => Number(pp.positionId)),
      isMicUse: updatedParty.isMicUse,
      azitId: Number(updatedParty.azitId),
      azitName: dto.azitName || (party as any).azit.azitName,
      azitIconUrl: dto.azitIconUrl || (party as any).azit.imageUrl,
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
