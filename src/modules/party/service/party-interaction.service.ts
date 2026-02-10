import { injectable, inject } from "tsyringe";
import { Result, created, ok, notFound, forbidden, conflict } from "../../../common/types/result.type";
import { PartyInteractionRepository } from '../repository/party-interaction.repository';
import { PartyRepository } from '../repository/party.repository';
import { ApplyPartyResDto, HandleApplicationResDto, ToggleLikeResDto, InteractionMessageResDto, ApplicationListResDto, ApplicationItemDto, MyApplicationListResDto, ApplicationItemWithPostDto } from "../dtos/party-interaction.res.dto";
import { PartyErrorCode } from "../../../common/constants/error-code";
import { PartyValidator } from "../utils/party.validator";

@injectable()
export class PartyInteractionService {
  constructor(
    @inject(PartyInteractionRepository) private readonly interactionRepo: PartyInteractionRepository,
    @inject(PartyRepository) private readonly partyRepo: PartyRepository
  ) {}

  private formatDate(date?: Date): string {
    const targetDate = (date instanceof Date && !isNaN(date.getTime())) ? date : new Date();
    return targetDate.toISOString().replace('T', ' ').substring(0, 19);
  }

  // 1. 파티 참가 신청 (applyParty)
  async applyParty(userId: number, postId: number): Promise<Result<ApplyPartyResDto>> {
    // 1-1. Validator를 통해 파티 존재 확인 및 에러 자동 반환
    const { party, error } = await PartyValidator.validateParty(this.partyRepo, postId);
    if (error) return error;

    // 1-2. 본인 파티 여부 검증
    if (Number(party.userId) === userId) {
      return forbidden({ message: "본인 파티에는 신청할 수 없습니다.", errorCode: PartyErrorCode.CANNOT_APPLY_TO_OWN_PARTY });
    }

    // 1-3. 중복 신청 확인
    const existing = await this.interactionRepo.findApplication(userId, postId);
    if (existing) return conflict({ message: "이미 신청한 파티입니다.", errorCode: PartyErrorCode.ALREADY_APPLIED });

    // 1-4. 신청 생성 및 반환
    const application = await this.interactionRepo.createApplication(userId, postId);
    return created({
      applicationId: Number(application.id),
      partyId: Number(application.postId),
      status: "PENDING",
      createdAt: this.formatDate(application.applicationAt),
      message: "신청이 완료되었습니다."
    } as ApplyPartyResDto);
  }

  // 2. 파티 신청 수락/거절 (handleApplication)
  async handleApplication(leaderId: number, applicationId: number, isAccepted: boolean): Promise<Result<HandleApplicationResDto>> {
    // 2-1. 신청 내역 및 권한 확인
    const application = await this.interactionRepo.findApplicationWithPost(applicationId);
    if (!application) return notFound({ message: "신청 내역을 찾을 수 없습니다.", errorCode: PartyErrorCode.APPLICATION_NOT_FOUND });
    if (application.isAccepted) return conflict({ message: "이미 승낙된 신청입니다.", errorCode: PartyErrorCode.ALREADY_ACCEPTED });
    if (Number(application.post.userId) !== leaderId) return forbidden({ message: "방장만 처리할 수 있습니다.", errorCode: PartyErrorCode.FORBIDDEN });

    // 2-2. 상태 업데이트
    const updated = await this.interactionRepo.updateApplicationStatus(applicationId, isAccepted);
    return ok({
      applicationId: Number(updated.id),
      partyId: Number(updated.postId),
      status: updated.isAccepted ? "APPROVED" : "REJECTED",
      updatedAt: this.formatDate(new Date()),
      message: updated.isAccepted ? "신청이 수락되었습니다." : "신청이 거절되었습니다."
    } as HandleApplicationResDto);
  }

  // 3. 파티 참가 신청 취소 (cancelApplication)
  async cancelApplication(userId: number, applicationId: number): Promise<Result<InteractionMessageResDto>> {
    // 3-1. 본인 신청 여부 확인
    const application = await this.interactionRepo.findApplicationWithPost(applicationId);
    if (!application) return notFound({ message: "신청 내역을 찾을 수 없습니다.", errorCode: PartyErrorCode.APPLICATION_NOT_FOUND });
    if (Number(application.userId) !== userId) return forbidden({ message: "본인만 취소할 수 있습니다.", errorCode: PartyErrorCode.FORBIDDEN });

    // 3-2. 삭제 처리
    const partyId = Number(application.postId);
    await this.interactionRepo.deleteApplication(applicationId);
    return ok({ 
      message: "가입 신청이 성공적으로 취소되었습니다.",
      partyId: partyId,
      updatedAt: this.formatDate(new Date())
    } as InteractionMessageResDto);
  }

  // 4. 파티 신청자 목록 조회 (getApplications)
  async getApplications(leaderId: number, postId: number): Promise<Result<ApplicationListResDto>> {
    const { error } = await PartyValidator.checkPartyOwnership(this.partyRepo, postId, leaderId);
    if (error) return error;

    const applications = await this.interactionRepo.findApplicationsByPostId(postId);

    const applicationsDto: ApplicationItemDto[] = applications.map((app) => {
      const post = app.post as any;
      const currentParticipants = (post.applications?.length ?? 0) + 1;
      const recruitmentPeople = post.recruitmentPeople ?? 0;
      const gameName = post.game?.name ?? "-";

      return {
        applicationId: Number(app.id),
        gameName,
        applicant: {
          id: Number(app.user.id),
          nickname: app.user.nickname ?? null,
          avatarUrl: (app.user as any).userAvatars?.[0]?.avatar?.avatarUrl ?? null,
          trustScore: app.user.trustScore,
        },
        recruitmentStatus: `${currentParticipants}/${recruitmentPeople}`,
        memo: post.memo ?? null,
        createdAt: this.formatDate(app.applicationAt),
      };
    });

    return ok({
      totalCount: applicationsDto.length,
      applications: applicationsDto,
    } as ApplicationListResDto);
  }

  // 5. 내가 작성한 모든 파티의 신청자 목록 조회 (getAllMyApplications)
  async getAllMyApplications(leaderId: number): Promise<Result<MyApplicationListResDto>> {
    const applications = await this.interactionRepo.findApplicationsByLeaderId(leaderId);

    const applicationsDto: ApplicationItemWithPostDto[] = applications.map((app) => {
      const post = app.post as any;
      const currentParticipants = (post.applications?.length ?? 0) + 1;
      const recruitmentPeople = post.recruitmentPeople ?? 0;
      const gameName = post.game?.name ?? "-";

      return {
        applicationId: Number(app.id),
        postId: Number(post.id),
        postTitle: post.title ?? "-",
        gameName,
        applicant: {
          id: Number(app.user.id),
          nickname: app.user.nickname ?? null,
          avatarUrl: (app.user as any).userAvatars?.[0]?.avatar?.avatarUrl ?? null,
          trustScore: app.user.trustScore,
        },
        recruitmentStatus: `${currentParticipants}/${recruitmentPeople}`,
        memo: post.memo ?? null,
        createdAt: this.formatDate(app.applicationAt),
      };
    });

    return ok({
      totalCount: applicationsDto.length,
      applications: applicationsDto,
    } as MyApplicationListResDto);
  }

  // 6. 파티 좋아요 토글 (toggleLike)
  async toggleLike(userId: number, postId: number): Promise<Result<ToggleLikeResDto>> {
    // 4-1. Validator를 통해 파티 존재 확인
    const { error } = await PartyValidator.validateParty(this.partyRepo, postId);
    if (error) return error;

    // 4-2. 좋아요 토글 로직
    const existingLike = await this.interactionRepo.findLike(userId, postId);
    if (existingLike) {
      await this.interactionRepo.deleteLike(userId, postId);
      return ok({ partyId: postId, isLiked: false, message: "좋아요 취소" } as ToggleLikeResDto);
    } else {
      await this.interactionRepo.createLike(userId, postId);
      return ok({ partyId: postId, isLiked: true, message: "좋아요 성공" } as ToggleLikeResDto);
    }
  }
}