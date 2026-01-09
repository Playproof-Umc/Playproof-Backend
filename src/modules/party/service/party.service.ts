import { injectable, inject } from "tsyringe";
import { PartyRepository } from "../repository/party.repository";
import { Result, created, notFound, ok } from "../../../common/types/result.type";
import { PartyCreateReqDto } from "../dtos/party.req.dto";
import { PartyCreateResDto, PartyGetResDto } from "../dtos/party.res.dto";
import { PartyErrorCode } from "../../../common/constants/error-code";

@injectable()
export class PartyService {
  constructor(
    @inject(PartyRepository) private partyRepository: PartyRepository,
  ) {}

  async createParty(dto: PartyCreateReqDto, userId: number): Promise<Result<PartyCreateResDto>> {  
    const party = await this.partyRepository.createParty(dto, userId);
    
    // 아지트 생성 로직 아직 구현 안됨
    
    return created({
      partyId: Number(party.id),
      userId: Number(party.userId),
      gameId: Number(party.gameId),
      title: party.title,
      memo: party.memo,
      recruitmentPeople: party.recruitmentPeople,
      tierId: Number(party.tierId),
      positionId: Number(party.positionId),
      isMicUse: party.isMicUse,
      azitId: Number(party.azitId),
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
    return ok({
      partyId: Number(party.id),
    });
  }
}
