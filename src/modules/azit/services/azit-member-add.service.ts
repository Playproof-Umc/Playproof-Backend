// src/modules/azit/services/azit-member-add.service.ts
import { injectable, inject } from "tsyringe";
import { AzitRepository } from "../repositories/azit.repository";
import { AzitUserRepository } from "../repositories/azit-user.repository";
import { UserRepository } from "../../user/user.repository";
import { AddAzitMemberReqDto } from "../dtos/azit.req.dto";
import { AddAzitMemberResDto } from "../dtos/azit.res.dto";
import { Result, created, notFound, forbidden, conflict } from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";
import { UserErrorCode } from "../../../common/constants/error-code";
import { AzitUserRole } from "@prisma/client";

@injectable()
export class AzitMemberAddService {
    constructor(
        @inject(AzitRepository) private azitRepository: AzitRepository,
        @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
        @inject(UserRepository) private userRepository: UserRepository,
    ) {}

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
            user_id: Number(newMember.user.id),
            nickname: newMember.user.nickname,
            avatar_url: avatarUrl,
            role: newMember.role,
            grade: newMember.user.grade,
            trust_score: newMember.user.trustScore,
            joined_at: newMember.joinedAt,
        };

        return created(response);
    }
}
