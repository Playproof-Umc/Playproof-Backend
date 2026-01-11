// src/common/config/multer.ts
import multer from 'multer';

const IMAGE_MIME_TYPE_PREFIX = 'image/';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB


// 파일이 이미지 타입인지 확인합니다.
const isImageFile = (mimetype: string): boolean => {
  return mimetype.startsWith(IMAGE_MIME_TYPE_PREFIX);
};

// 메모리에 저장 (S3로 바로 업로드하기 위함)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (isImageFile(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  },
});

