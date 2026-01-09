import { injectable, inject } from "tsyringe";
import { PartyRepository } from "../repository/party.repository";
import { 
  Result, ok, forbidden, notFound, conflict, badRequest, created 
} from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";

@injectable()
export class PartyInteractionService {
  constructor(@inject(PartyRepository) private partyRepository: PartyRepository) {}

  /**
   * 1. 파티 가입 신청 (신청하기)
   */
  async createApplication(userId: number, postId: number): Promise<Result<any>> {
    // 본인 파티인지 확인
    const post = await this.partyRepository.findPartyPostById(postId);
    if (!post) return notFound({ message: "파티를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND });
    if (Number(post.userId) === userId) {
      return badRequest({ message: "본인이 작성한 파티에는 신청할 수 없습니다.", errorCode: PartyErrorCode.CANNOT_APPLY_TO_OWN_PARTY });
    }

    // 중복 신청 확인
    const existing = await this.partyRepository.findApplicationByUserAndPost(userId, postId);
    if (existing) {
      return conflict({ message: "이미 신청한 파티입니다.", errorCode: PartyErrorCode.ALREADY_APPLIED });
    }

    const newApp = await this.partyRepository.createApplication(userId, postId);
    return created({ message: "가입 신청이 완료되었습니다.", data: newApp });
  }

  /**
   * 2. 가입 신청 취소 (신청자 본인)
   */
  async cancelApplication(userId: number, applicationId: number): Promise<Result<any>> {
    const application = await this.partyRepository.findApplicationWithPost(applicationId);
    if (!application) return notFound({ message: "신청 내역을 찾을 수 없습니다.", errorCode: PartyErrorCode.APPLICATION_NOT_FOUND });

    // 본인의 신청인지 확인
    if (Number(application.userId) !== userId) {
      return forbidden({ message: "본인의 신청 내역만 취소할 수 있습니다.", errorCode: PartyErrorCode.FORBIDDEN });
    }

    await this.partyRepository.deleteApplication(applicationId);
    return ok({ message: "신청이 취소되었습니다." });
  }

  /**
   * 3. 가입 신청 승낙/거절 (방장 권한) - 아까 짠 로직 유지
   */
  async handleApplication(managerId: number, applicationId: number, isAccepted: boolean): Promise<Result<any>> {
    const application = await this.partyRepository.findApplicationWithPost(applicationId);
    if (!application) return notFound({ message: "신청 내역이 없습니다.", errorCode: PartyErrorCode.APPLICATION_NOT_FOUND });
    
    if (Number(application.post.userId) !== managerId) {
      return forbidden({ message: "방장만 처리할 수 있습니다.", errorCode: PartyErrorCode.FORBIDDEN });
    }

    const updated = await this.partyRepository.updateApplicationStatus(applicationId, isAccepted);
    return ok({ message: isAccepted ? "승낙되었습니다." : "거절되었습니다.", data: updated });
  }

    
}