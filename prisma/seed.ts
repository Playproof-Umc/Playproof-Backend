// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// 마스터 데이터 상수
// ============================================================================

const POSITIVE_CATEGORIES = [
  '협력적이었어요',
  '실력이 우수해요',
  '소통이 원활했어요',
  '하드캐리 가능',
  '재밌어요',
  '오더 가능!',
];

const NEGATIVE_CATEGORIES = [
  '과도한 욕설',
  '계정 도용 행위',
  '고의 트롤, 어뷰징',
  '핵, 치트 의심',
];

// ============================================================================
// 마스터 데이터 시드 함수
// ============================================================================

async function seedMasterDataByName(params: {
  model: any; // Prisma 모델 (예: prisma.positiveCategory)
  names: string[]; // 시드할 이름 배열
  logName: string; // 로그에 표시할 이름
}): Promise<void> {
  const { model, names, logName } = params;

  for (const name of names) {
    await model.upsert({
      where: { name }, // name으로 찾기 (unique 필드)
      update: {}, // 있으면 업데이트 (변경 없음)
      create: { name }, // 없으면 생성
    });
  }

  console.log(`✅ ${logName} 시드 완료 (${names.length}개)`);
}

// ----------------------------------------------------------------------------------------------------

async function main() {
  console.log('마스터 데이터 시드 시작...\n');

  // 긍정 피드백 카테고리
  await seedMasterDataByName({
    model: prisma.positiveCategory,
    names: POSITIVE_CATEGORIES,
    logName: '긍정 피드백 카테고리',
  });

  // 부정 피드백 카테고리
  await seedMasterDataByName({
    model: prisma.negativeCategory,
    names: NEGATIVE_CATEGORIES,
    logName: '부정 피드백 카테고리',
  });

  // 새로운 마스터 테이블 추가 예시:
  // await seedMasterDataByName({
  //   model: prisma.game,
  //   names: POSITIVE_CATEGORIES,
  //   logName: '게임',
  // });

  console.log('\n✅ 모든 마스터 데이터 시드 완료');
}

main()
  .catch((e) => {
    console.error('❌ 시드 실행 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
