import { injectable, inject } from "tsyringe";
import { Result, created, ok, notFound, forbidden, conflict } from "../../../common/types/result.type";
import { PartyInteractionRepository } from '../repository/party-interaction.repository';
import { PartyRepository } from '../repository/party.repository';
import { ApplyPartyResDto, HandleApplicationResDto, ToggleLikeResDto, InteractionMessageResDto } from "../dtos/party-interaction.res.dto";
import { PartyErrorCode } from "../../../common/constants/error-code";
import { PartyValidator } from "../utils/party.validator";

@injectable()
export class PartyInteractionService {
  // // 1. 생성자 주입
  constructor(
    @inject(PartyInteractionRepository) private readonly partyInteractionRepository: PartyInteractionRepository,
    @inject(PartyRepository) private readonly partyRepository: PartyRepository
  ) {}

  // // 2. 날짜 포맷팅 유틸리티 (내부 전용)
  private formatDate(date?: Date): string {
    const targetDate = (date instanceof Date && !isNaN(date.getTime())) ? date : new Date();
    return targetDate.toISOString().replace('T', ' ').substring(0, 19);
  }

  // // 3. 파티 참가 신청 (applyParty)
  async applyParty(userId: number, postId: number): Promise<Result<ApplyPartyResDto>> {
    // 3-1. 파티 존재 확인 (Validator 활용)
    const party = await this.partyRepository.findById(postId);
    if (!party) return notFound({ message: "파티를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND });

    // 3-2. 본인 파티 여부 검증
    if (Number(party.userId) === userId) {
      return forbidden({ message: "본인 파티에는 신청할 수 없습니다.", errorCode: PartyErrorCode.CANNOT_APPLY_TO_OWN_PARTY });
    }

    // 3-3. 이미 신청했는지 중복 확인
    const existing = await this.partyInteractionRepository.findApplication(userId, postId);
    if (existing) return conflict({ message: "이미 신청한 파티입니다.", errorCode: PartyErrorCode.ALREADY_APPLIED });

    // 3-4. 신청 생성 및 반환 (DTO 형식 준수)
    const application = await this.partyInteractionRepository.createApplication(userId, postId);
    
    return created({
      applicationId: Number(application.id),
      partyId: Number(application.postId),
      status: "PENDING",
      createdAt: this.formatDate(application.applicationAt),
      message: "신청이 완료되었습니다."
    } as ApplyPartyResDto);
  }

  // // 4. 파티 신청 수락/거절 (handleApplication)
  async handleApplication(leaderId: number, applicationId: number, isAccepted: boolean): Promise<Result<HandleApplicationResDto>> {
    // 4-1. 신청 내역 조회 및 예외 처리
    const application = await this.partyInteractionRepository.findApplicationWithPost(applicationId);
    if (!application) return notFound({ message: "신청 내역을 찾을 수 없습니다.", errorCode: PartyErrorCode.APPLICATION_NOT_FOUND });

    // 4-2. 이미 승낙된 건인지 확인
    if (application.isAccepted) {
      return conflict({ message: "이미 승낙된 신청입니다.", errorCode: PartyErrorCode.ALREADY_ACCEPTED });
    }

    // 4-3. 방장 권한 확인 (Validator 로직 응용)
    if (Number(application.post.userId) !== leaderId) {
      return forbidden({ message: "방장만 처리할 수 있습니다.", errorCode: PartyErrorCode.FORBIDDEN });
    }

    // 4-4. 상태 업데이트
    const updated = await this.partyInteractionRepository.updateApplicationStatus(applicationId, isAccepted);
    if (!updated) return notFound({ message: "업데이트할 대상을 찾을 수 없습니다.", errorCode: PartyErrorCode.APPLICATION_NOT_FOUND });
    
    // 4-5. 결과 반환 (DTO 형식 준수)
    return ok({
      applicationId: Number(updated.id),
      partyId: Number(updated.postId),
      status: updated.isAccepted ? "APPROVED" : "REJECTED",
      updatedAt: this.formatDate(new Date()),
      message: updated.isAccepted ? "신청이 수락되었습니다." : "신청이 거절되었습니다."
    } as HandleApplicationResDto);
  }

  // // 5. 파티 참가 신청 취소 (cancelApplication)
  async cancelApplication(userId: number, applicationId: number): Promise<Result<InteractionMessageResDto>> {
    // 5-1. 신청 내역 조회 및 권한 체크
    const application = await this.partyInteractionRepository.findApplicationWithPost(applicationId);
    if (!application) return notFound({ message: "신청 내역을 찾을 수 없습니다.", errorCode: PartyErrorCode.APPLICATION_NOT_FOUND });

    if (Number(application.userId) !== userId) {
      return forbidden({ message: "본인만 취소할 수 있습니다.", errorCode: PartyErrorCode.FORBIDDEN });
    }

    // 5-2. 삭제 처리
    const partyId = Number(application.postId);
    await this.partyInteractionRepository.deleteApplication(applicationId);
    
    // 5-3. 결과 반환 (DTO 형식 준수)
    return ok({ 
      message: "가입 신청이 성공적으로 취소되었습니다.",
      partyId: partyId,
      updatedAt: this.formatDate(new Date())
    } as InteractionMessageResDto);
  }

  // // 6. 파티 좋아요 토글 (toggleLike)
  async toggleLike(userId: number, postId: number): Promise<Result<ToggleLikeResDto>> {
    // 6-1. 파티 존재 확인
    const party = await this.partyRepository.findById(postId);
    if (!party) return notFound({ message: "파티를 찾을 수 없습니다.", errorCode: PartyErrorCode.NOT_FOUND });

    // 6-2. 좋아요 존재 여부에 따른 토글 로직
    const existingLike = await this.partyInteractionRepository.findLike(userId, postId);
    if (existingLike) {
      await this.partyInteractionRepository.deleteLike(userId, postId);
      return ok({ partyId: postId, isLiked: false, message: "좋아요 취소" } as ToggleLikeResDto);
    } else {
      await this.partyInteractionRepository.createLike(userId, postId);
      return ok({ partyId: postId, isLiked: true, message: "좋아요 성공" } as ToggleLikeResDto);
    }
  }
}