// src/modules/azit/services/azit.service.ts
import { injectable, inject } from 'tsyringe';
import { AzitUserRole } from '@prisma/client';

import { AzitCreateReqDto, AzitUpdateReqDto } from '../dtos/azit.req.dto';
import { AzitResDto, AzitListResDto } from '../dtos/azit.res.dto';
import { AzitRepository } from '../repositories/azit.repository';
import { AzitUserRepository } from '../repositories/azit-user.repository';
import {
  checkAzitNameDuplicate,
  checkAzitAndMemberAndHost,
} from '../utils/azit.validator';
import { prisma } from '../../../common/config/database';
import {
  Result,
  created,
  ok,
  noContent,
} from '../../../common/types/result.type';
import {
  uploadFileToS3,
  deleteFileFromS3,
} from '../../../common/utils/file-util';

@injectable()
export class AzitService {
  constructor(
    @inject(AzitRepository) private azitRepository: AzitRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
  ) {}

  async createAzit(
    userId: bigint,
    dto: AzitCreateReqDto,
    file?: Express.Multer.File,
  ): Promise<Result<AzitResDto>> {
    // 1. 사용자가 소속된 아지트 중 같은 이름이 있는지 확인
    const result = await checkAzitNameDuplicate(
      this.azitUserRepository,
      userId,
      dto.azit_name,
    );
    if (result) {
      return result;
    }

    let imageUrl: string | null = null;
    if (file) {
      const uploadResult = await uploadFileToS3(file, 'azit-icons');
      if (uploadResult.error) {
        return uploadResult;
      }
      imageUrl = uploadResult.data;
    }

    // 2. 아지트 생성 및 멤버 추가 (트랜잭션)
    const azit = await prisma.$transaction(async (tx) => {
      const createdAzit = await this.azitRepository.createAzit(
        dto.azit_name,
        imageUrl,
        tx,
      );

      // 생성자를 방장(HOST)으로 멤버 추가
      await this.azitUserRepository.createAzitUser(
        userId,
        createdAzit.id,
        AzitUserRole.HOST,
        tx,
      );

      return createdAzit;
    });

    return created(AzitResDto.from(azit));
  }

  async getAzitsByUserId(userId: bigint): Promise<Result<AzitListResDto>> {
    const azits = await this.azitUserRepository.findAzitsByUserId(userId);

    return ok({
      azits: azits.map(AzitResDto.from),
    });
  }

  async updateAzit(
    userId: bigint,
    azitId: bigint,
    dto: AzitUpdateReqDto,
    file?: Express.Multer.File,
  ): Promise<Result<AzitResDto>> {
    // 1. 아지트 존재, 멤버 존재, 멤버장 권한 확인
    const result = await checkAzitAndMemberAndHost(
      this.azitRepository,
      this.azitUserRepository,
      userId,
      azitId,
      'update',
    );
    if (result.error) {
      return result;
    }
    const azit = result.data;

    // 2. 제목 변경 확인 (null이면 유지, 값이 있으면 변경)
    let azitName = azit.azitName;
    if (dto.azit_name != null) {
      const nameCheckResult = await checkAzitNameDuplicate(
        this.azitUserRepository,
        userId,
        dto.azit_name,
        azit.azitName,
      );
      if (nameCheckResult) {
        return nameCheckResult;
      }
      azitName = dto.azit_name;
    }

    // 3. 아이콘 처리
    let imageUrl = azit.imageUrl;

    // 갱신, 삭제 시 기존 파일 삭제
    if (dto.is_delete_icon || file) {
      if (imageUrl) {
        const deleteResult = await deleteFileFromS3(imageUrl);
        if (deleteResult.error) {
          console.error('Failed to delete file from S3:', deleteResult.error);
        }
      }
    }

    if (dto.is_delete_icon) {
      imageUrl = null;
    } else if (file) {
      const uploadResult = await uploadFileToS3(file, 'azit-icons');
      if (uploadResult.error) {
        return uploadResult;
      }
      imageUrl = uploadResult.data;
    }

    // 4. 아지트 업데이트
    const updatedAzit = await this.azitRepository.updateAzit(azitId, {
      azitName,
      imageUrl,
    });

    return ok(AzitResDto.from(updatedAzit));
  }

  async deleteAzit(userId: bigint, azitId: bigint): Promise<Result<null>> {
    // 1. 아지트 존재 확인 및 멤버장 권한 확인
    const result = await checkAzitAndMemberAndHost(
      this.azitRepository,
      this.azitUserRepository,
      userId,
      azitId,
      'delete',
    );
    if (result.error) {
      return result;
    }
    const azit = result.data;

    // 2. S3 아이콘 파일 삭제
    if (azit.imageUrl) {
      const deleteResult = await deleteFileFromS3(azit.imageUrl);
      if (deleteResult.error) {
        console.error('Failed to delete file from S3:', deleteResult.error);
      }
    }

    // 3. 아지트 삭제
    await this.azitRepository.deleteAzit(azitId);

    return noContent();
  }
}
