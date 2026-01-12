// src/modules/azit/services/azit-member-remove.service.ts
import { injectable, inject } from "tsyringe";
import { AzitRepository } from "../repositories/azit.repository";
import { AzitUserRepository } from "../repositories/azit-user.repository";
import { RemoveAzitMemberResDto } from "../dtos/azit.res.dto";
import { Result, ok, notFound, forbidden, badRequest } from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";
import { AzitUserRole } from "@prisma/client";

@injectable()
export class AzitMemberRemoveService {
    constructor(
        @inject(AzitRepository) private azitRepository: AzitRepository,
        @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
    ) {}

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
            user_id: Number(targetMember.user.id),
            nickname: targetMember.user.nickname,
            removed_at: new Date(),
            reason,
        };

        return ok(response);
    }
}
