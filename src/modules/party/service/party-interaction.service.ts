import { injectable } from "tsyringe";
import { Result, created, ok, notFound, forbidden, conflict } from "../../../common/types/result.type";
import { PartyInteractionRepository } from '../repository/party-interaction.repository';
import { PartyRepository } from '../repository/party.repository';
import { ApplyPartyResDto, HandleApplicationResDto, ToggleLikeResDto, InteractionMessageResDto } from "../dtos/party-interaction.res.dto";

@injectable()
export class PartyInteractionService {
  // 1. 생성자 주입 (Repository 연결)
  constructor(
    private readonly partyInteractionRepository: PartyInteractionRepository,
    private readonly partyRepository: PartyRepository
  ) {}

  // 2. 날짜 포맷팅 유틸리티
  private formatDate(date?: Date): string {
    const targetDate = (date instanceof Date && !isNaN(date.getTime())) ? date : new Date();
    return targetDate.toISOString().replace('T', ' ').substring(0, 19);
  }

  // 3. 파티 참가 신청 (applyParty)
  async applyParty(userId: number, postId: number): Promise<Result<ApplyPartyResDto>> {
    const post = await this.partyRepository.findPartyPostById(postId);
    if (!post) return notFound({ message: "파티를 찾을 수 없습니다.", errorCode: "PARTY_404" });

    if (Number(post.userId) === userId) {
      return forbidden({ message: "본인 파티에는 신청할 수 없습니다.", errorCode: "PARTY_403" });
    }

    const existing = await this.partyInteractionRepository.findApplication(userId, postId);
    if (existing) return conflict({ message: "이미 신청한 파티입니다.", errorCode: "PARTY_409" });

    const application = await this.partyInteractionRepository.createApplication(userId, postId);
    
    return created({
      applicationId: Number(application.id),
      partyId: Number(application.postId),
      status: "PENDING",
      createdAt: this.formatDate(application.applicationAt),
      message: "신청이 완료되었습니다."
    });
  }

  // 4. 파티 신청 수락/거절 (handleApplication)
  async handleApplication(leaderId: number, applicationId: number, isAccepted: boolean): Promise<Result<HandleApplicationResDto>> {
    // 1. 신청 내역 및 파티 정보 조회
    const application = await this.partyInteractionRepository.findApplicationWithPost(applicationId);
    if (!application) {
      return notFound({ message: "신청 내역을 찾을 수 없습니다.", errorCode: "APP_404" });
    }

    // 2. 이미 승낙된 신청인지 확인 (테스트 409 에러 해결 포인트)
    // 💡 이미 isAccepted가 true인 경우, 중복 승낙을 방지하기 위해 409 Conflict 반환
    if (application.isAccepted) {
      return conflict({ message: "이미 승낙된 신청입니다.", errorCode: "APP_409" });
    }

    // 3. 권한 확인 (방장 여부)
    if (Number(application.post.userId) !== leaderId) {
      return forbidden({ message: "방장만 처리할 수 있습니다.", errorCode: "APP_403" });
    }

    // 4. 상태 업데이트 실행
    const updated = await this.partyInteractionRepository.updateApplicationStatus(applicationId, isAccepted);
    
    if (!updated) {
      return notFound({ message: "상태 업데이트 중 신청 내역을 찾을 수 없습니다.", errorCode: "APP_404_1" });
    }
    
    // 5. 결과 반환
    return ok({
      applicationId: Number(updated.id),
      partyId: Number(updated.postId),
      status: updated.isAccepted ? "APPROVED" : "REJECTED",
      updatedAt: this.formatDate(new Date()),
      message: updated.isAccepted ? "신청이 수락되었습니다." : "신청이 거절되었습니다."
    });
  }

  // 5. 파티 참가 신청 취소 (cancelApplication)
  async cancelApplication(userId: number, applicationId: number): Promise<Result<InteractionMessageResDto>> {
    // 1. 신청 내역 조회
    const application = await this.partyInteractionRepository.findApplicationWithPost(applicationId);
    
    // 2. 예외 처리
    if (!application) {
      return notFound({ message: "신청 내역을 찾을 수 없습니다.", errorCode: "APP_404" });
    }

    // 3. 권한 체크
    if (Number(application.userId) !== Number(userId)) {
      return forbidden({ message: "본인만 취소할 수 있습니다.", errorCode: "APP_403" });
    }

    // 4. 정보 보관
    const partyId = Number(application.postId);

    // 5. 삭제 처리
    await this.partyInteractionRepository.deleteApplication(applicationId);
    
    // 6. 시영님이 원하는 섹시한 데이터 반환
    return ok({ 
      message: "가입 신청이 성공적으로 취소되었습니다.",
      partyId: partyId,
      updatedAt: this.formatDate(new Date())
    });
  }

  // 6. 파티 좋아요 토글 (toggleLike)
  async toggleLike(userId: number, postId: number): Promise<Result<ToggleLikeResDto>> {
    const post = await this.partyRepository.findPartyPostById(postId);
    if (!post) return notFound({ message: "파티를 찾을 수 없습니다.", errorCode: "PARTY_404" });

    const existingLike = await this.partyInteractionRepository.findLike(userId, postId);
    if (existingLike) {
      await this.partyInteractionRepository.deleteLike(userId, postId);
      return ok({ partyId: postId, isLiked: false, message: "좋아요 취소" });
    } else {
      await this.partyInteractionRepository.createLike(userId, postId);
      return ok({ partyId: postId, isLiked: true, message: "좋아요 성공" });
    }
  }
}