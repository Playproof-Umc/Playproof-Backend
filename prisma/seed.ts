// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 마스터 데이터 시드 시작...\n');

  // 긍정 피드백 카테고리
  const positiveCategories = [
    '협력적이었어요',
    '소통이 원활했어요',
    '재밌어요',
    '실력이 우수해요',
    '하드캐리 가능',
    '오더 가능!',
  ];

  for (const name of positiveCategories) {
    await prisma.positiveCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(
    `✅ 긍정 피드백 카테고리 시드 완료 (${positiveCategories.length}개)`,
  );

  // 부정 피드백 카테고리
  const negativeCategories = [
    '과도한 욕설',
    '고의 트롤, 어뷰징',
    '계정 도용 행위',
    '핵, 치트 의심',
  ];

  for (const name of negativeCategories) {
    await prisma.negativeCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(
    `✅ 부정 피드백 카테고리 시드 완료 (${negativeCategories.length}개)`,
  );

  // 새로운 마스터 테이블 추가 시 여기에 추가

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
