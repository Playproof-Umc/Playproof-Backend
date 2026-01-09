import { injectable, inject } from "tsyringe";
import { PartyInteractionRepository } from "../repository/party-interaction.repository";
import { PartyRepository } from "../repository/party.repository";
import { Result, ok, notFound, forbidden, conflict, created } from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";

@injectable()
export class PartyInteractionService {
  constructor(
    @inject(PartyInteractionRepository) private interactionRepo: PartyInteractionRepository,
    @inject(PartyRepository) private partyRepo: PartyRepository
  ) {}

  // 1. 파티 참가 신청 로직 (본인 확인 및 중복 체크 포함)
  async applyParty(userId: number, postId: number): Promise<Result<any>> {
    const post = await this.partyRepo.findPartyPostById(postId);
    if (!post) {
      return notFound({ 
        message: "존재하지 않는 파티입니다.", 
        errorCode: PartyErrorCode.NOT_FOUND 
      });
    }

    if (Number(post.userId) === userId) {
      return forbidden({ 
        message: "본인이 만든 파티에는 신청할 수 없습니다.", 
        errorCode: PartyErrorCode.CANNOT_APPLY_TO_OWN_PARTY 
      });
    }

    const existing = await this.interactionRepo.findApplication(userId, postId);
    if (existing) {
      return conflict({ 
        message: "이미 신청한 파티입니다.", 
        errorCode: PartyErrorCode.ALREADY_APPLIED 
      });
    }

    const application = await this.interactionRepo.createApplication(userId, postId);
    return created({ applicationId: Number(application.id), message: "신청이 완료되었습니다." });
  }

  // 2. 참가 신청 취소 로직 (본인 여부 검증)
  async cancelApplication(userId: number, applicationId: number): Promise<Result<any>> {
    const app = await this.interactionRepo.findApplicationWithPost(applicationId);
    if (!app) {
      return notFound({ 
        message: "신청 내역을 찾을 수 없습니다.", 
        errorCode: PartyErrorCode.APPLICATION_NOT_FOUND 
      });
    }

    if (Number(app.userId) !== userId) {
      return forbidden({ 
        message: "본인의 신청만 취소할 수 있습니다.", 
        errorCode: PartyErrorCode.FORBIDDEN 
      });
    }

    await this.interactionRepo.deleteApplication(applicationId);
    return ok({ message: "신청이 취소되었습니다." });
  }

  // 3. 신청 승낙/거절 로직 (방장 권한 및 상태 검증)
  async handleApplication(leaderId: number, applicationId: number, isAccepted: boolean): Promise<Result<any>> {
    const app = await this.interactionRepo.findApplicationWithPost(applicationId);
    if (!app) {
      return notFound({ 
        message: "신청 내역이 없습니다.", 
        errorCode: PartyErrorCode.APPLICATION_NOT_FOUND 
      });
    }

    if (Number(app.post.userId) !== leaderId) {
      return forbidden({ 
        message: "방장만 권한이 있습니다.", 
        errorCode: PartyErrorCode.FORBIDDEN 
      });
    }

    if (app.isAccepted && isAccepted) {
      return conflict({ 
        message: "이미 승낙된 신청입니다.", 
        errorCode: PartyErrorCode.ALREADY_ACCEPTED 
      });
    }

    await this.interactionRepo.updateApplicationStatus(applicationId, isAccepted);
    return ok({ message: isAccepted ? "수락되었습니다." : "거절되었습니다." });
  }

  // 4. 좋아요 등록 및 해제 토글 로직
  async toggleLike(userId: number, postId: number): Promise<Result<any>> {
    const post = await this.partyRepo.findPartyPostById(postId);
    if (!post) {
      return notFound({ 
        message: "파티가 없습니다.", 
        errorCode: PartyErrorCode.NOT_FOUND 
      });
    }

    const existing = await this.interactionRepo.findLike(userId, postId);
    if (existing) {
      await this.interactionRepo.deleteLike(userId, postId);
      return ok({ isLiked: false, message: "좋아요 취소" });
    } else {
      await this.interactionRepo.createLike(userId, postId);
      return ok({ isLiked: true, message: "좋아요 성공" });
    }
  }
}