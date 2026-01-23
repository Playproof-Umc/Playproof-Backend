// src/modules/highlight/utils/highlight.validator.ts
import { injectable, inject } from "tsyringe";
import { AzitRepository } from "../../azit/repositories/azit.repository";
import { AzitUserRepository } from "../../azit/repositories/azit-user.repository";
import {
  Result,
  notFound,
  forbidden,
  badRequest,
} from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";

@injectable()
export class HighlightValidator {
  constructor(
    @inject(AzitRepository) private azitRepository: AzitRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
  ) {}

  /**
   * 아지트 존재 여부 및 사용자 멤버 권한 확인
   */
  async validateAzitAccess<T>(
    userId: bigint,
    azitId: bigint,
    action: string = "접근",
  ): Promise<Result<T> | null> {
    // 1. 아지트 존재 여부 확인
    const azit = await this.azitRepository.findAzitById(azitId);
    if (!azit) {
      return notFound({
        message: "아지트를 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND_AZIT,
      }) as Result<T>;
    }

    // 2. 사용자가 아지트 멤버인지 확인
    const azitUserRole = await this.azitUserRepository.findAzitUserRoleByUserIdAndAzitId(
      userId,
      azitId,
    );
    if (!azitUserRole) {
      return forbidden({
        message: `아지트 멤버만 하이라이트를 ${action}할 수 있습니다.`,
        errorCode: `HIGHLIGHT_${action.toUpperCase()}_FORBIDDEN`,
      }) as Result<T>;
    }

    return null;
  }

  /**
   * 미디어 파일 검증 (개수, 크기, 타입)
   */
  validateMediaFiles(files: Express.Multer.File[] | undefined): Result<any> | null {
    // 1. 파일 존재 여부 확인
    if (!files || files.length === 0) {
      return badRequest({
        message: "요청 파라미터가 잘못되었습니다.",
        errorCode: "COMMON_INVALID_PARAMETER",
        errors: [
          {
            field: "medias",
            value: null,
            reason: "최소 1개 이상의 미디어 파일이 필요합니다.",
          },
        ],
      });
    }

    // 2. 파일 개수 확인
    if (files.length > 10) {
      return badRequest({
        message: "요청 파라미터가 잘못되었습니다.",
        errorCode: "COMMON_INVALID_PARAMETER",
        errors: [
          {
            field: "medias",
            value: null,
            reason: "최대 10개의 미디어 파일까지만 업로드할 수 있습니다.",
          },
        ],
      });
    }

    // 3. 각 파일 크기 및 타입 검증
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const errors = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          field: "medias",
          value: file.originalname,
          reason: "파일 크기가 100MB를 초과합니다.",
        });
      }

      const isImage = file.mimetype.startsWith("image/");
      const isVideo = file.mimetype.startsWith("video/");
      if (!isImage && !isVideo) {
        errors.push({
          field: "medias",
          value: file.originalname,
          reason: "지원하지 않는 파일 형식입니다. (이미지, 영상만 가능)",
        });
      }
    }

    if (errors.length > 0) {
      return badRequest({
        message: "요청 파라미터가 잘못되었습니다.",
        errorCode: "COMMON_INVALID_PARAMETER",
        errors,
      });
    }

    return null;
  }

  /**
   * 기존 미디어 + 신규 미디어 개수 검증 (수정 시 사용)
   */
  validateMediaCountForUpdate(
    existingMediaCount: number,
    newFileCount: number,
  ): Result<any> | null {
    const totalMediaCount = existingMediaCount + newFileCount;
    if (totalMediaCount > 10) {
      return badRequest({
        message: "요청 파라미터가 잘못되었습니다.",
        errorCode: "COMMON_INVALID_PARAMETER",
        errors: [
          {
            field: "medias",
            value: null,
            reason: `기존 미디어와 신규 미디어를 합쳐서 최대 10개까지만 가능합니다. (현재: ${existingMediaCount}개 기존 + ${newFileCount}개 신규 = ${totalMediaCount}개)`,
          },
        ],
      });
    }

    return null;
  }

  /**
   * 신규 미디어 파일 검증 (수정 시 추가 파일용)
   */
  validateNewMediaFiles(files: Express.Multer.File[] | undefined): Result<any> | null {
    // 파일이 없으면 검증 통과 (수정 시 파일 추가는 선택사항)
    if (!files || files.length === 0) {
      return null;
    }

    // 2. 파일 개수 확인
    if (files.length > 10) {
      return badRequest({
        message: "요청 파라미터가 잘못되었습니다.",
        errorCode: "COMMON_INVALID_PARAMETER",
        errors: [
          {
            field: "medias",
            value: null,
            reason: "최대 10개의 미디어 파일까지만 업로드할 수 있습니다.",
          },
        ],
      });
    }

    // 3. 각 파일 크기 및 타입 검증
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const errors = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          field: "medias",
          value: file.originalname,
          reason: "파일 크기가 100MB를 초과합니다.",
        });
      }

      const isImage = file.mimetype.startsWith("image/");
      const isVideo = file.mimetype.startsWith("video/");
      if (!isImage && !isVideo) {
        errors.push({
          field: "medias",
          value: file.originalname,
          reason: "지원하지 않는 파일 형식입니다. (이미지, 영상만 가능)",
        });
      }
    }

    if (errors.length > 0) {
      return badRequest({
        message: "요청 파라미터가 잘못되었습니다.",
        errorCode: "COMMON_INVALID_PARAMETER",
        errors,
      });
    }

    return null;
  }
}
