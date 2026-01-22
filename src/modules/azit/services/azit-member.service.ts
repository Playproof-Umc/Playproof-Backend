// src/modules/azit/services/azit-member.service.ts
import { injectable, inject } from "tsyringe";
import { AzitRepository } from "../repositories/azit.repository";
import { AzitUserRepository } from "../repositories/azit-user.repository";
import { UserRepository } from "../../user/user.repository";
import { AddAzitMemberReqDto } from "../dtos/azit.req.dto";
import { GetAzitMembersResDto, AzitMemberResDto, AddAzitMemberResDto, RemoveAzitMemberResDto } from "../dtos/azit.res.dto";
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
        cursor: string | undefined,
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

        // 커서 기반 멤버 목록 조회 (size + 1개 조회)
        const membersData = await this.azitUserRepository.findMembersByAzitIdWithCursor(
            azitId,
            cursor || null,
            size,
        );

        // has_next 판단 및 실제 반환할 데이터 분리
        const hasNext = membersData.length > size;
        const actualMembers = hasNext ? membersData.slice(0, size) : membersData;

        // 응답 DTO 변환
        const members: AzitMemberResDto[] = actualMembers.map((azitUser) => {
            const equippedAvatar = azitUser.user.userAvatars[0];
            const avatarUrl = equippedAvatar?.avatar?.avatarUrl || null;

            return {
                member_id: Number(azitUser.id),
                nickname: azitUser.user.nickname,
                avatar_url: avatarUrl,
                role: azitUser.role,
            };
        });

        // next_cursor 계산 (마지막 항목의 닉네임, null이면 null)
        const lastMember = actualMembers[actualMembers.length - 1];
        const nextCursor = hasNext && lastMember && lastMember.user.nickname
            ? lastMember.user.nickname
            : null;

        const response: GetAzitMembersResDto = {
            azit_id: Number(azit.id),
            azit_name: azit.azitName,
            members,
            next_cursor: nextCursor,
            has_next: hasNext,
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
        const host = await this.azitUserRepository.findAzitUserByUserIdAndAzitId(hostUserId, azitId);
        if (!host || host.role !== AzitUserRole.HOST) {
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
        const requestUser = await this.azitUserRepository.findAzitUserByUserIdAndAzitId(
            requestUserId,
            azitId,
        );
        if (!requestUser) {
            return forbidden({
                message: "해당 아지트의 멤버가 아닙니다.",
                errorCode: "AZIT_NOT_MEMBER",
            });
        }

        // 4. 권한 조합 계산
        const isSelf = targetMember.userId === requestUserId;
        const isHost = requestUser.role === AzitUserRole.HOST;

        // 5. 권한 검증
        // Case 1: 일반 멤버는 본인만 제거 가능 (타인 제거 시도 시 권한 없음)
        if (!isSelf && !isHost) {
            return forbidden({
                message: "멤버를 제거할 권한이 없습니다.",
                errorCode: "AZIT_MEMBER_REMOVE_FORBIDDEN",
            });
        }

        // 6. 호스트 보호
        // 호스트는 본인을 제거할 수 없음 (호스트는 항상 1명만 존재)
        if (isSelf && isHost) {
            return badRequest({
                message: "요청을 처리할 수 없습니다.",
                errorCode: "AZIT_LAST_HOST_CANNOT_REMOVE",
                errors: [
                    {
                        field: "member_id",
                        value: Number(memberId),
                        reason: "아지트장은 제거할 수 없습니다.",
                    },
                ],
            });
        }


        // 7. 멤버 제거
        await this.azitUserRepository.deleteAzitUser(memberId);

        // 8. 제거 사유 결정
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
