// src/common/config/multer.ts
import multer from 'multer';

const IMAGE_MIME_TYPE_PREFIX = 'image/';
const VIDEO_MIME_TYPE_PREFIX = 'video/';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (하이라이트 클립 지원)


// 파일이 이미지 또는 영상 타입인지 확인합니다.
const isMediaFile = (mimetype: string): boolean => {
  return mimetype.startsWith(IMAGE_MIME_TYPE_PREFIX) || mimetype.startsWith(VIDEO_MIME_TYPE_PREFIX);
};

// 메모리에 저장 (S3로 바로 업로드하기 위함)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // 최대 10개 파일
  },
  fileFilter: (req, file, cb) => {
    if (isMediaFile(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('이미지 또는 영상 파일만 업로드 가능합니다.'));
    }
  },
});

