import { injectable, inject } from 'tsyringe';
import { PartyRepository } from '../repository/party.repository';
import {
  Result,
  created,
  notFound,
  ok,
  forbidden,
  internalServerError,
  badRequest,
} from '../../../common/types/result.type';
import {
  PartyCreateReqDto,
  PartyUpdateReqDto,
  PartyListReqDto,
} from '../dtos/party.req.dto';
import {
  PartyCreateResDto,
  PartyGetResDto,
  PartyDeleteResDto,
  PartyListResDto,
} from '../dtos/party.res.dto';
import { PartyErrorCode } from '../../../common/constants/error-code';
import { prisma } from '../../../common/config/database';
import { PartyValidator } from '../utils/party.validator';

@injectable()
export class PartyService {
  constructor(
    @inject(PartyRepository) private partyRepository: PartyRepository,
  ) {}

  // 1. 파티 생성 (createParty)
  async createParty(
    dto: PartyCreateReqDto,
    userId: number,
  ): Promise<Result<PartyCreateResDto>> {
    // 1-1. 마스터 데이터 검증 (Validator 활용)
    const masterError = await PartyValidator.validateMasterData(
      this.partyRepository,
      dto,
    );
    if (masterError) return masterError;
    console.log('here1');

    // 1-2. 아지트 정보 검증 및 설정
    const { azitId } = dto;
    if (azitId == null) {
      return badRequest({
        message: '아지트 아이디는 필수입니다.',
        errorCode: PartyErrorCode.INVALID_AZIT_ID,
      });
    }
    let azitName: string | null = null;
    let azitIconUrl: string | null = null;
    console.log('here2');

    const azit = await this.partyRepository.findAzitById(azitId);
    if (!azit)
      return notFound({
        message: '아지트를 찾을 수 없습니다.',
        errorCode: PartyErrorCode.NOT_FOUND_AZIT,
      });
    azitName = azit.azitName;
    azitIconUrl = azit.imageUrl ?? null;

    console.log('here3');

    // 1-3. 파티 생성
    const party = await this.partyRepository.createParty(
      dto,
      userId,
      azitId ?? null,
    );

    console.log('here4');
    if (!party) {
      return internalServerError({
        message: '파티 생성에 실패했습니다.',
        errorCode: PartyErrorCode.INTERNAL_SERVER_ERROR,
      });
    }

    // 1-4. 응답 DTO 반환
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
      azitName,
      azitIconUrl,
      createdAt: party.createdAt,
    } as PartyCreateResDto);
  }

  // 2. 파티 수정 (updateParty)
  async updateParty(
    id: number,
    dto: PartyUpdateReqDto,
    userId: number,
  ): Promise<Result<PartyCreateResDto>> {
    // 2-1. 존재 여부 및 방장 권한 검증 (공통 메소드 활용)
    const party = await this.partyRepository.findPartyPostByPostId(id);
    if (!party)
      return notFound({
        message: '파티를 찾을 수 없습니다.',
        errorCode: PartyErrorCode.NOT_FOUND,
      });
    if (Number(party.userId) !== userId)
      return forbidden({
        message: '수정 권한이 없습니다.',
        errorCode: PartyErrorCode.FORBIDDEN,
      });

    // 2-2. 마스터 데이터 검증
    const masterError = await PartyValidator.validateMasterData(
      this.partyRepository,
      dto,
    );
    if (masterError) return masterError;

    // 2-2.5. 아지트 아이디 검증 (null 금지, 존재 여부 확인)
    if (dto.azitId === null) {
      return badRequest({
        message: '아지트 아이디는 null일 수 없습니다.',
        errorCode: PartyErrorCode.INVALID_AZIT_ID,
      });
    }
    if (dto.azitId !== undefined) {
      const azit = await this.partyRepository.findAzitById(dto.azitId);
      if (!azit)
        return notFound({
          message: '아지트를 찾을 수 없습니다.',
          errorCode: PartyErrorCode.NOT_FOUND_AZIT,
        });
    }

    // 2-3. 파티 정보 업데이트
    await prisma.$transaction(async (tx) => {
      return await this.partyRepository.updateParty(id, dto, tx);
    });

    // 2-4. 결과 조회 및 반환
    const updated = await this.partyRepository.findById(id);
    if (!updated)
      return notFound({
        message: '업데이트 후 파티를 찾을 수 없습니다.',
        errorCode: PartyErrorCode.NOT_FOUND,
      });

    return ok({
      partyId: Number(updated.id),
      userId: Number(updated.userId),
      gameId: Number(updated.gameId),
      title: updated.title,
      memo: updated.memo,
      recruitmentPeople: updated.recruitmentPeople,
      tierId: updated.tierId ? Number(updated.tierId) : null,
      positionIds:
        dto.positionIds ||
        updated.postPositions.map((pp: any) => Number(pp.positionId)),
      isMicUse: updated.isMicUse,
      azitId: Number(updated.azitId),
      azitName: updated.azit.azitName,
      azitIconUrl: updated.azit.imageUrl,
      createdAt: updated.createdAt,
    } as PartyCreateResDto);
  }

  // 3. 파티 삭제 (deleteParty)
  async deleteParty(
    id: number,
    userId: number,
  ): Promise<Result<PartyDeleteResDto>> {
    // 3-1. 권한 검증 (공통 메소드 활용)
    const party = await this.partyRepository.findPartyPostByPostId(id);
    if (!party)
      return notFound({
        message: '파티를 찾을 수 없습니다.',
        errorCode: PartyErrorCode.NOT_FOUND,
      });
    if (Number(party.userId) !== userId)
      return forbidden({
        message: '삭제 권한이 없습니다.',
        errorCode: PartyErrorCode.FORBIDDEN,
      });

    // 3-2. 파티 삭제 및 아지트 정리
    await prisma.$transaction(async (tx) => {
      await this.partyRepository.deleteParty(id, tx);
      const partyCount = await this.partyRepository.countPartiesByAzitId(
        Number(party.azitId),
        tx,
      );
      if (partyCount === 0)
        await this.partyRepository.deleteAzit(Number(party.azitId), tx);
    });

    return ok({
      partyId: id,
      message: '파티가 삭제되었습니다.',
      deletedAt: new Date(),
    } as PartyDeleteResDto);
  }

  // 4. 파티 단건 조회 (getParty)
  async getParty(id: number): Promise<Result<PartyGetResDto>> {
    const party = await this.partyRepository.incrementViewCount(id);
    if (!party)
      return notFound({
        message: '파티를 찾을 수 없습니다.',
        errorCode: PartyErrorCode.NOT_FOUND,
      });

    return ok(this.mapToGetResDto(party));
  }

  // 5. 파티 목록 조회 (getParties)
  async getParties(dto: PartyListReqDto): Promise<Result<PartyListResDto>> {
    const { page, size, sort } = dto;
    const [parties, totalCount] = await Promise.all([
      this.partyRepository.findParties(page, size, sort),
      this.partyRepository.countAll(),
    ]);

    const hasNext = page * size < totalCount;
    return ok({
      parties: parties.map((p) => this.mapToGetResDto(p)),
      nextCursor: hasNext ? page + 1 : null,
      hasNext,
    } as PartyListResDto);
  }

  // 6. 마이페이지 - 내가 쓴 파티(매칭) 목록 조회
  async getMyParties(userId: number, page: number, size: number): Promise<Result<PartyListResDto>> {
    const [parties, totalCount] = await Promise.all([
      this.partyRepository.findPartiesByUserId(userId, page, size),
      this.partyRepository.countByUserId(userId),
    ]);

    const hasNext = page * size < totalCount;
    return ok({
      parties: parties.map((p) => this.mapToGetResDto(p)),
      nextCursor: hasNext ? page + 1 : null,
      hasNext,
    } as PartyListResDto);
  }

  // 6. 응답 데이터 매핑 (Private)
  private mapToGetResDto(party: any): PartyGetResDto {
    return {
      partyId: Number(party.id),
      gameId: Number(party.gameId),
      host: {
        id: Number(party.user.id),
        nickname: party.user.nickname,
        trustScore: party.user.trustScore,
        avatarUrl: party.user.userAvatars[0]?.avatar?.avatarUrl || null,
      },
      title: party.title,
      memo: party.memo,
      tierName: party.tier?.name || null,
      azitName: party.azit?.azitName ?? null,
      azitId: party.azitId ? Number(party.azitId) : null,
      participants: party.recruitmentPeople,
      currentParticipants: party.applications.length + 1,
      isMic: party.isMicUse,
      status: party.recruitmentStatus,
      viewCount: Number(party.viewCount),
      likeCount: party._count?.postLikes ?? 0,
      commentCount: party._count?.postComments ?? 0,
      tags: party.postCategories.map((pc: any) => ({
        id: Number(pc.category.id),
        name: pc.category.name,
      })),
      positions: party.postPositions.map((pp: any) => ({
        positionId: Number(pp.position.id),
        positionName: pp.position.name,
      })),
      createdAt: party.createdAt,
      updatedAt: party.updatedAt,
    };
  }
}
