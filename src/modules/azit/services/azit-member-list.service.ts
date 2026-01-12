// src/modules/azit/services/azit-member-list.service.ts
import { injectable, inject } from "tsyringe";
import { AzitRepository } from "../repositories/azit.repository";
import { AzitUserRepository } from "../repositories/azit-user.repository";
import { GetAzitMembersResDto, AzitMemberResDto, PaginationResDto } from "../dtos/azit.res.dto";
import { Result, ok, notFound } from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";

@injectable()
export class AzitMemberListService {
    constructor(
        @inject(AzitRepository) private azitRepository: AzitRepository,
        @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
    ) {}

    async getAzitMembers(
        azitId: bigint,
        page: number,
        size: number,
    ): Promise<Result<GetAzitMembersResDto>> {
        // 아지트 존재 여부 확인
        const azit = await this.azitRepository.findAzitById(azitId);

        if (!azit) {
            return notFound({
                message: "아지트를 찾을 수 없습니다.",
                errorCode: PartyErrorCode.NOT_FOUND_AZIT,
            });
        }

        // 전체 멤버 수 조회
        const totalElements = await this.azitUserRepository.countMembersByAzitId(azitId);

        // 페이지네이션된 멤버 목록 조회
        const membersData = await this.azitUserRepository.findMembersByAzitIdWithPagination(
            azitId,
            page,
            size,
        );

        // 응답 DTO 변환
        const members: AzitMemberResDto[] = membersData.map((azitUser) => {
            const equippedAvatar = azitUser.user.userAvatars[0];
            const avatarUrl = equippedAvatar?.avatar?.avatarUrl || null;

            return {
                member_id: Number(azitUser.id),
                user_id: Number(azitUser.user.id),
                nickname: azitUser.user.nickname,
                avatar_url: avatarUrl,
                role: azitUser.role,
                grade: azitUser.user.grade,
                trust_score: azitUser.user.trustScore,
                joined_at: azitUser.joinedAt,
            };
        });

        const totalPages = Math.ceil(totalElements / size);

        const pagination: PaginationResDto = {
            page,
            size,
            total_pages: totalPages,
            total_elements: totalElements,
        };

        const response: GetAzitMembersResDto = {
            azit_id: Number(azit.id),
            azit_name: azit.azitName,
            total_members: totalElements,
            members,
            pagination,
        };

        return ok(response);
    }
}
