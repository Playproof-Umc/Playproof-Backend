// src/modules/azit/services/azit.service.ts
import { injectable, inject } from "tsyringe";
import { AzitRepository } from "../repositories/azit.repository";
import { AzitUserRepository } from "../repositories/azit-user.repository";
import { AzitCreateReqDto } from "../dtos/azit.req.dto";
import { AzitCreateResDto } from "../dtos/azit.res.dto";
import { Result, created, conflict, internalServerError } from "../../../common/types/result.type";
import { uploadFileToS3 } from "../../../common/utils/file-util";
import { AzitUserRole } from "@prisma/client";

@injectable()
export class AzitService {
  constructor(
    @inject(AzitRepository) private azitRepository: AzitRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository
  ) {}

  async createAzit(
    userId: bigint,
    dto: AzitCreateReqDto,
    file?: Express.Multer.File
  ): Promise<Result<AzitCreateResDto>> {
    // 1. 사용자가 소속된 아지트 중 같은 이름이 있는지 확인
    const existingAzitNames = await this.azitUserRepository.findAzitNamesByUserId(userId);
    
    if (existingAzitNames.includes(dto.azit_name)) {
      return conflict({
        message: "이미 소속된 아지트 중 같은 이름의 아지트가 있습니다.",
        errorCode: "AZIT_NAME_DUPLICATE",
      });
    }

    let imageUrl: string | null = null;
    if (file) {
      try {
        imageUrl = await uploadFileToS3(file, 'azit-icons');
      } catch (error) {
        return internalServerError({
          message: "파일 업로드에 실패했습니다.",
          errorCode: "S3_UPLOAD_FAILED",
        });
      }
    }

    // 2. 아지트 생성
    const azit = await this.azitRepository.createAzit(
      dto.azit_name,
      imageUrl
    );

    // 3. 생성자를 방장(HOST)으로 멤버 추가
    await this.azitUserRepository.createAzitUser(userId, azit.id, AzitUserRole.HOST);

    return created({
      azit_id: Number(azit.id),
      azit_name: azit.azitName,
      azit_icon_url: azit.imageUrl,
    });
  }
}

