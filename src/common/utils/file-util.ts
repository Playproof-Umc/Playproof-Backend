// src/common/utils/file-util.ts
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../config/s3';

/**
 * 파일을 S3에 업로드하고 URL을 반환합니다.
 * @param file - multer로 받은 파일 객체
 * @param folder - S3 내 저장할 폴더 경로
 * @returns 업로드된 파일의 S3 URL
 */
export async function uploadFileToS3(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  // 고유한 파일명 생성: 타임스탬프_랜덤숫자_원본파일명
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const fileName = `${timestamp}-${random}-${file.originalname}`;
  const key = `${folder}/${fileName}`;

  // S3에 업로드
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  // S3 URL 반환
  const region = process.env.AWS_REGION || 'ap-northeast-2';
  return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * S3에서 파일을 삭제합니다.
 * @param fileUrl - 삭제할 파일의 S3 URL
 */
export async function deleteFileFromS3(fileUrl: string): Promise<void> {
  // URL에서 key 추출
  const url = new URL(fileUrl);
  let key = url.pathname.substring(1);
  
  // URL 디코딩 (한글 등 특수문자 처리)
  try {
    key = decodeURIComponent(key);
  } catch (error) {
    // 디코딩 실패 시 원본 key 사용
    console.warn('Failed to decode URL, using original key:', key);
  }

  // S3에서 파일 삭제
  const result = await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }));
}
