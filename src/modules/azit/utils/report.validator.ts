// src/modules/azit/utils/report.validator.ts
import { injectable, inject } from "tsyringe";
import { UserRepository } from "../../user/user.repository";
import {
  Result,
  notFound,
  badRequest,
} from "../../../common/types/result.type";
import { UserErrorCode } from "../../../common/constants/error-code";

@injectable()
export class ReportValidator {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
  ) {}

  
  //신고 대상 사용자 존재 여부 확인
   
  async validateTargetUser<T>(targetId: bigint): Promise<Result<T> | null> {
    const targetUser = await this.userRepository.findById(Number(targetId));
    if (!targetUser) {
      return notFound({
        message: "요청한 리소스를 찾을 수 없습니다.",
        errorCode: UserErrorCode.NOT_FOUND,
        errors: [
          {
            field: "target_id",
            value: Number(targetId),
            reason: "존재하지 않는 사용자입니다.",
          },
        ],
      }) as Result<T>;
    }

    return null;
  }

  //자기 자신을 신고할 수 없도록 검증 
  validateNotSelfReport<T>(userId: bigint, targetId: bigint): Result<T> | null {
    if (userId === targetId) {
      return badRequest({
        message: "요청 파라미터가 잘못되었습니다.",
        errorCode: "COMMON_INVALID_PARAMETER",
        errors: [
          {
            field: "target_id",
            value: Number(targetId),
            reason: "자기 자신을 신고할 수 없습니다.",
          },
        ],
      }) as Result<T>;
    }

    return null;
  }

  //미디어 파일 검증 
  validateMediaFiles(files: Express.Multer.File[] | undefined): Result<any> | null {
    // 파일이 없으면 검증 통과 
    if (!files || files.length === 0) {
      return null;
    }

    // 파일 개수 확인
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

    // 각 파일 크기 및 타입 검증
    const MAX_FILE_SIZE = 100 * 1024 * 1024; 
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
