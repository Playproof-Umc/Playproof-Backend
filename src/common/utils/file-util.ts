// src/common/utils/file-util.ts
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../config/s3';
import { Result, ok, internalServerError } from '../types/result.type';
import { FileUploadErrorCode } from '../constants/error-code';

/**
 * 파일을 S3에 업로드하고 URL을 반환합니다.
 * @param file - multer로 받은 파일 객체
 * @param folder - S3 내 저장할 폴더 경로
 * @returns 성공 시 Result<string>, 실패 시 Result<never>
 */
export async function uploadFileToS3(
  file: Express.Multer.File,
  folder: string
): Promise<Result<string>> {
  // 고유한 파일명 생성: 타임스탬프-랜덤숫자-확장자
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  
  // 한글 파일명 제거
  const originalName = file.originalname || 'file';
  const lastDotIndex = originalName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex).toLowerCase() : '';
  
  const fileName = `${timestamp}-${random}${extension}`;
  
  const key = `${folder}/${fileName}`;

  // S3에 업로드
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  const sendPromise = s3Client.send(command);
  
  // Promise의 결과를 확인하여 에러 처리
  const result = await Promise.resolve(sendPromise).then(
    () => {
      const region = process.env.AWS_REGION || 'ap-northeast-2';
      const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
      return ok(url);
    },
    (error) => {
      return internalServerError({
        message: '파일 업로드에 실패했습니다.',
        errorCode: FileUploadErrorCode.S3_UPLOAD_FAILED,
      });
    }
  );
  
  return result;
}

/**
 * S3에서 파일을 삭제합니다.
 * @param fileUrl - 삭제할 파일의 S3 URL
 * @returns 성공 시 Result<void>, 실패 시 Result<never>
 */
export async function deleteFileFromS3(fileUrl: string): Promise<Result<void>> {
  try {
    // URL에서 key 추출
    const url = new URL(fileUrl);
    let key = url.pathname.substring(1);

    // URL 디코딩 (한글 등 특수문자 처리)
    try {
      key = decodeURIComponent(key);
    } catch {
      // 디코딩 실패 시 원본 key 사용
      console.warn('Failed to decode URL, using original key:', key);
    }

    // S3에서 파일 삭제
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
    );

    return ok(undefined);
  } catch {
    return internalServerError({
      message: '파일 삭제에 실패했습니다.',
      errorCode: FileUploadErrorCode.S3_UPLOAD_FAILED,
    });
  }
}
