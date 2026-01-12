import { injectable, inject } from "tsyringe";
import { PartyRepository } from "../repository/party.repository";
import { Result, created, notFound, ok, forbidden } from "../../../common/types/result.type";
import { PartyCreateReqDto, PartyUpdateReqDto, PartyListReqDto } from "../dtos/party.req.dto";
import { PartyCreateResDto, PartyGetResDto, PartyDeleteResDto, PartyListResDto } from "../dtos/party.res.dto";
import { PartyErrorCode } from "../../../common/constants/error-code";
import { prisma } from "../../../common/config/database";

@injectable()
export class PartyService {
  constructor(
    @inject(PartyRepository) private partyRepository: PartyRepository,
  ) {}

  // 게임 마스터 테치블 데이터 검증
  private async validateGame(gameId: number) {
    const game = await this.partyRepository.findGameById(gameId);
    if (!game) {
      return notFound({
        message: "게임을 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND_GAME,
      });
    }
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
  }

  private async validatePositions(positionIds: number[]) {
    if (positionIds && positionIds.length > 0) {
      const positions = await this.partyRepository.findPositionsByIds(positionIds);
      if (positions.length !== positionIds.length) {
        return notFound({
          message: "일부 포지션을 찾을 수 없습니다.",
          errorCode: PartyErrorCode.NOT_FOUND_POSITION,
        });
      }
    }
  }

  async createParty(dto: PartyCreateReqDto, userId: number): Promise<Result<PartyCreateResDto>> {  
    const { azitName, azitIconUrl, azitId, ...rest } = dto;

    // 1. 마스터 데이터 검증
    this.validateGame(dto.gameId);
    this.validateTier(dto.tierId);
    this.validatePositions(dto.positionIds);

    // 2. 아지트 검증
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
          errorCode: PartyErrorCode.NOT_FOUND_AZIT, // 적절한 에러 코드가 없어 일단 이걸로 사용
        });
      }
      finalAzitName = azitName;
      finalAzitIconUrl = azitIconUrl;
    }

    // 3. 아지트 및 파티 생성 (트랜잭션)
    const result = await prisma.$transaction(async (tx) => {
      let currentAzitId = azitId;

      if (!currentAzitId) {
        // 아지트 신규 생성
        const tempAzit = await this.partyRepository.createTempAzit(finalAzitName, finalAzitIconUrl, tx);
        currentAzitId = Number(tempAzit.id);
      }
      
      // 파티 생성
      const party = await this.partyRepository.createParty(rest, userId, Number(currentAzitId), tx);

      return { party, azitId: currentAzitId };
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
      azitName: finalAzitName,
      azitIconUrl: finalAzitIconUrl,
      createdAt: party.createdAt,
    } as PartyCreateResDto);
  }

  async updateParty(id: number, dto: PartyUpdateReqDto, userId: number): Promise<Result<PartyCreateResDto>> {
    // 1. 파티 존재 여부 및 권한 확인
    const party = await this.partyRepository.findById(id);
    if (!party) {
      return notFound({
        message: "파티를 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND,
      });
    }

    if (Number(party.userId) !== userId) {
      return forbidden({
        message: "파티 수정 권한이 없습니다.",
        errorCode: PartyErrorCode.FORBIDDEN,
      });
    }

    // 2. 마스터 데이터 검증
    if(dto.gameId)
      this.validateGame(dto.gameId);

    if (dto.tierId) 
      this.validateTier(dto.tierId);

    if (dto.positionIds && dto.positionIds.length > 0) 
      this.validatePositions(dto.positionIds);

    if (dto.azitId) {
      const azit = await this.partyRepository.findAzitById(dto.azitId);
      if (!azit) {
        return notFound({
          message: "아지트를 찾을 수 없습니다.",
          errorCode: PartyErrorCode.NOT_FOUND_AZIT,
        });
      }
    }

    // 3. 트랜잭션 업데이트
    const updatedPartyResult = await prisma.$transaction(async (tx) => {
      // 아지트 정보 업데이트 (필요한 경우)
      // azitId가 새로 들어왔다면 해당 아지트로 연결만 변경
      // azitId는 없고 azitName/azitIconUrl만 있다면 기존 아지트 정보 수정
      if (!dto.azitId && (dto.azitName || dto.azitIconUrl)) {
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

    // 4. 결과 반환
    // 최신 정보 조회를 위해 다시 조회 (관계 데이터 포함)
    const finalParty = await this.partyRepository.findById(id);
    if (!finalParty) {
      return notFound({
        message: "파티를 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND,
      });
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

  async deleteParty(id: number, userId: number): Promise<Result<PartyDeleteResDto>> {
    // 1. 파티 존재 여부 및 권한 확인
        const party = await this.partyRepository.findById(id);
    if (!party) {
      return notFound({
        message: "파티를 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND,
      });
    }

    if (Number(party.userId) !== userId) {
      return forbidden({
        message: "파티 삭제 권한이 없습니다.",
        errorCode: PartyErrorCode.FORBIDDEN,
      });
    }

    // 2. 트랜잭션 삭제
    await prisma.$transaction(async (tx) => {
      // 파티 삭제 (관련 데이터 포함)
      await this.partyRepository.deleteParty(id, tx);
      
      // 아지트 삭제 여부 결정: 이 아지트를 사용하는 다른 파티가 없을 때만 삭제
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

  async getParty(id: number): Promise<Result<PartyGetResDto>> {
    const party = await this.partyRepository.findById(id);
    if (!party) {
      return notFound({
        message: "파티를 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND,
      });
    }

    return ok(this.mapToGetResDto(party));
  }

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
      currentParticipants: party.applications.length + 1, // 방장 포함
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
