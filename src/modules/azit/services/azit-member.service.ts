// src/modules/azit/services/azit-member.service.ts
import { injectable, inject } from "tsyringe";
import { AzitRepository } from "../repositories/azit.repository";
import { AzitUserRepository } from "../repositories/azit-user.repository";
import { UserRepository } from "../../user/user.repository";
import { AddAzitMemberReqDto } from "../dtos/azit.req.dto";
import { GetAzitMembersResDto, AzitMemberResDto, PaginationResDto, AddAzitMemberResDto, RemoveAzitMemberResDto } from "../dtos/azit.res.dto";
import { Result, ok, created, notFound, forbidden, conflict, badRequest } from "../../../common/types/result.type";
import { PartyErrorCode, UserErrorCode } from "../../../common/constants/error-code";
import { AzitUserRole } from "@prisma/client";

@injectable()
export class AzitMemberService {
    constructor(
        @inject(AzitRepository) private azitRepository: AzitRepository,
        @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
        @inject(UserRepository) private userRepository: UserRepository,
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

    async addAzitMember(
        hostUserId: bigint,
        azitId: bigint,
        dto: AddAzitMemberReqDto,
    ): Promise<Result<AddAzitMemberResDto>> {
        // 1. 아지트 존재 여부 확인
        const azit = await this.azitRepository.findAzitById(azitId);
        if (!azit) {
            return notFound({
                message: "아지트를 찾을 수 없습니다.",
                errorCode: PartyErrorCode.NOT_FOUND_AZIT,
            });
        }

        // 2. 사용자가 해당 아지트의 멤버장인지 확인
        const hostRole = await this.azitUserRepository.findAzitUserRoleByUserIdAndAzitId(hostUserId, azitId);
        if (!hostRole || hostRole !== AzitUserRole.HOST) {
            return forbidden({
                message: "아지트 멤버 추가는 멤버장만 가능합니다.",
                errorCode: "AZIT_MEMBER_ADD_FORBIDDEN",
            });
        }

        // 3. 추가할 사용자 존재 여부 확인
        const targetUser = await this.userRepository.findById(dto.user_id);
        if (!targetUser) {
            return notFound({
                message: "사용자를 찾을 수 없습니다.",
                errorCode: UserErrorCode.NOT_FOUND,
            });
        }

        // 4. 이미 멤버인지 확인
        const existingMember = await this.azitUserRepository.findAzitUserByUserIdAndAzitId(
            BigInt(dto.user_id),
            azitId,
        );
        if (existingMember) {
            return conflict({
                message: "이미 해당 아지트의 멤버입니다.",
                errorCode: "AZIT_MEMBER_ALREADY_EXISTS",
            });
        }

        // 5. 멤버 추가
        const newMember = await this.azitUserRepository.createAzitUserWithDetails(
            BigInt(dto.user_id),
            azitId,
            AzitUserRole.MEMBER,
        );

        // 6. 응답 DTO 변환
        const equippedAvatar = newMember.user.userAvatars[0];
        const avatarUrl = equippedAvatar?.avatar?.avatarUrl || null;

        const response: AddAzitMemberResDto = {
            member_id: Number(newMember.id),
            azit_id: Number(azit.id),
            nickname: newMember.user.nickname,
            avatar_url: avatarUrl,
            role: newMember.role,
            grade: newMember.user.grade,
            trust_score: newMember.user.trustScore,
            joined_at: newMember.joinedAt,
        };

        return created(response);
    }

    async removeAzitMember(
        requestUserId: bigint,
        azitId: bigint,
        memberId: bigint,
    ): Promise<Result<RemoveAzitMemberResDto>> {
        // 1. 아지트 존재 여부 확인
        const azit = await this.azitRepository.findAzitById(azitId);
        if (!azit) {
            return notFound({
                message: "아지트를 찾을 수 없습니다.",
                errorCode: PartyErrorCode.NOT_FOUND_AZIT,
            });
        }

        // 2. 제거 대상 멤버 존재 여부 확인
        const targetMember = await this.azitUserRepository.findAzitUserById(memberId);
        if (!targetMember || targetMember.azitId !== azitId) {
            return notFound({
                message: "멤버를 찾을 수 없습니다.",
                errorCode: "AZIT_MEMBER_NOT_FOUND",
            });
        }

        // 3. 요청자의 역할 확인
        const requestUserRole = await this.azitUserRepository.findAzitUserRoleByUserIdAndAzitId(
            requestUserId,
            azitId,
        );
        if (!requestUserRole) {
            return forbidden({
                message: "해당 아지트의 멤버가 아닙니다.",
                errorCode: "AZIT_NOT_MEMBER",
            });
        }

        // 4. 권한 확인: 아지트장이거나 본인인 경우만 가능
        const isSelf = targetMember.userId === requestUserId;
        const isHost = requestUserRole === AzitUserRole.HOST;

        if (!isSelf && !isHost) {
            return forbidden({
                message: "멤버를 제거할 권한이 없습니다.",
                errorCode: "AZIT_MEMBER_REMOVE_FORBIDDEN",
            });
        }

        // 5. 마지막 아지트장인지 확인
        if (targetMember.role === AzitUserRole.HOST) {
            const hostCount = await this.azitUserRepository.countHostsByAzitId(azitId);
            if (hostCount <= 1) {
                return badRequest({
                    message: "요청을 처리할 수 없습니다.",
                    errorCode: "AZIT_LAST_HOST_CANNOT_REMOVE",
                    errors: [
                        {
                            field: "member_id",
                            value: Number(memberId),
                            reason: "마지막 아지트장은 제거할 수 없습니다. 다른 멤버를 먼저 아지트장으로 승격해주세요.",
                        },
                    ],
                });
            }
        }

        // 6. 멤버 제거
        await this.azitUserRepository.deleteAzitUser(memberId);

        // 7. 제거 사유 결정
        const reason = isSelf ? "SELF_LEAVE" : "FORCE_REMOVE";

        const response: RemoveAzitMemberResDto = {
            member_id: Number(targetMember.id),
            azit_id: Number(azit.id),
            nickname: targetMember.user.nickname,
            removed_at: new Date(),
            reason,
        };

        return ok(response);
    }
}
