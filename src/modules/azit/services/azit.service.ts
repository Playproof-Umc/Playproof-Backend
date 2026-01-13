// src/modules/azit/services/azit.service.ts
import { injectable, inject } from 'tsyringe';
import { AzitRepository } from '../repositories/azit.repository';
import { AzitUserRepository } from '../repositories/azit-user.repository';
import { AzitCreateReqDto, AzitUpdateReqDto } from '../dtos/azit.req.dto';
import { AzitCreateResDto, AzitListResDto } from '../dtos/azit.res.dto';
import {
  Result,
  created,
  ok,
  conflict,
  internalServerError,
  notFound,
  forbidden,
} from '../../../common/types/result.type';
import {
  uploadFileToS3,
  deleteFileFromS3,
} from '../../../common/utils/file-util';
import { AzitUserRole } from '@prisma/client';

@injectable()
export class AzitService {
  constructor(
    @inject(AzitRepository) private azitRepository: AzitRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
  ) {}

  /**
   * S3에서 파일을 삭제합니다. 실패해도 에러를 throw하지 않습니다.
   * @param fileUrl - 삭제할 파일의 S3 URL
   */
  private async deleteFile(fileUrl: string | null): Promise<void> {
    if (!fileUrl) {
      return;
    }

    try {
      await deleteFileFromS3(fileUrl);
    } catch (error) {
      // 삭제 실패해도 계속 진행
      console.error('Failed to delete file from S3:', error);
    }
  }

  // ----------------------------------------------------------------------------------------------------

  async createAzit(
    userId: bigint,
    dto: AzitCreateReqDto,
    file?: Express.Multer.File,
  ): Promise<Result<AzitCreateResDto>> {
    // 1. 사용자가 소속된 아지트 중 같은 이름이 있는지 확인
    const existingAzitNames =
      await this.azitUserRepository.findAzitNamesByUserId(userId);

    if (existingAzitNames.includes(dto.azit_name)) {
      return conflict({
        message: '이미 소속된 아지트 중 같은 이름의 아지트가 있습니다.',
        errorCode: 'AZIT_NAME_DUPLICATE',
      });
    }

    let imageUrl: string | null = null;
    if (file) {
      try {
        imageUrl = await uploadFileToS3(file, 'azit-icons');
      } catch (error) {
        return internalServerError({
          message: '파일 업로드에 실패했습니다.',
          errorCode: 'S3_UPLOAD_FAILED',
        });
      }
    }

    // 2. 아지트 생성
    const azit = await this.azitRepository.createAzit(dto.azit_name, imageUrl);

    // 3. 생성자를 방장(HOST)으로 멤버 추가
    await this.azitUserRepository.createAzitUser(
      userId,
      azit.id,
      AzitUserRole.HOST,
    );

    return created({
      azit_id: Number(azit.id),
      azit_name: azit.azitName,
      azit_icon_url: azit.imageUrl,
    });
  }

  async getAzitsByUserId(userId: bigint): Promise<Result<AzitListResDto>> {
    const azits = await this.azitUserRepository.findAzitsByUserId(userId);

    return ok({
      azits: azits.map((azit) => ({
        azit_id: Number(azit.id),
        azit_name: azit.azitName,
        azit_icon_url: azit.imageUrl,
      })),
    });
  }

  async updateAzit(
    userId: bigint,
    azitId: bigint,
    dto: AzitUpdateReqDto,
    file?: Express.Multer.File,
  ): Promise<Result<AzitCreateResDto>> {
    // 1. 아지트 존재 확인
    const azit = await this.azitRepository.findAzitById(azitId);
    if (!azit) {
      return notFound({
        message: '아지트를 찾을 수 없습니다.',
        errorCode: 'AZIT_NOT_FOUND',
      });
    }

    // 2. 사용자가 해당 아지트의 멤버장인지 확인
    const userRole =
      await this.azitUserRepository.findAzitUserRoleByUserIdAndAzitId(
        userId,
        azitId,
      );
    if (!userRole || userRole !== AzitUserRole.HOST) {
      return forbidden({
        message: '아지트 수정은 멤버장만 가능합니다.',
        errorCode: 'AZIT_UPDATE_FORBIDDEN',
      });
    }

    // 3. 제목 변경 확인 (null이면 유지, 값이 있으면 변경)
    let azitName = azit.azitName;
    if (dto.azit_name !== null && dto.azit_name !== undefined) {
      const existingAzitNames =
        await this.azitUserRepository.findAzitNamesByUserId(userId);
      if (
        existingAzitNames
          .filter((name) => name !== azit.azitName)
          .includes(dto.azit_name)
      ) {
        return conflict({
          message: '이미 소속된 아지트 중 같은 이름의 아지트가 있습니다.',
          errorCode: 'AZIT_NAME_DUPLICATE',
        });
      }
      azitName = dto.azit_name;
    }

    // 4. 아이콘 처리
    let imageUrl = azit.imageUrl;

    if (dto.is_delete_icon) {
      // 기존 파일이 있으면 S3에서 삭제
      await this.deleteFile(imageUrl);

      imageUrl = null;
    } else if (file) {
      // 새 파일 업로드 전에 기존 파일 삭제
      await this.deleteFile(imageUrl);

      try {
        imageUrl = await uploadFileToS3(file, 'azit-icons');
      } catch (error) {
        return internalServerError({
          message: '파일 업로드에 실패했습니다.',
          errorCode: 'S3_UPLOAD_FAILED',
        });
      }
    }

    // 5. 아지트 업데이트
    const updatedAzit = await this.azitRepository.updateAzit(azitId, {
      azitName,
      imageUrl,
    });

    return ok({
      azit_id: Number(updatedAzit.id),
      azit_name: updatedAzit.azitName,
      azit_icon_url: updatedAzit.imageUrl,
    });
  }

  async deleteAzit(userId: bigint, azitId: bigint): Promise<Result<void>> {
    // 1. 아지트 존재 확인
    const azit = await this.azitRepository.findAzitById(azitId);
    if (!azit) {
      return notFound({
        message: '아지트를 찾을 수 없습니다.',
        errorCode: 'AZIT_NOT_FOUND',
      });
    }

    // 2. 사용자가 해당 아지트의 멤버장인지 확인
    const userRole =
      await this.azitUserRepository.findAzitUserRoleByUserIdAndAzitId(
        userId,
        azitId,
      );
    if (!userRole || userRole !== AzitUserRole.HOST) {
      return forbidden({
        message: '아지트 삭제는 멤버장만 가능합니다.',
        errorCode: 'AZIT_DELETE_FORBIDDEN',
      });
    }

    // 3. S3 아이콘 파일 삭제
    await this.deleteFile(azit.imageUrl);

    // 4. 아지트 삭제
    try {
      await this.azitRepository.deleteAzit(azitId);
    } catch (error) {
      return internalServerError({
        message: '아지트 삭제에 실패했습니다.',
        errorCode: 'AZIT_DELETE_FAILED',
      });
    }

    return ok(undefined);
  }
}
