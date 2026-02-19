// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

// ============================================================================
// 마스터 데이터 상수
// ============================================================================

const POSITIVE_CATEGORIES = [
  '협력적이었어요',
  '소통이 원활했어요',
  '재밌어요',
  '실력이 우수해요',
  '하드캐리 가능',
  '오더 가능',
];

const NEGATIVE_CATEGORIES = [
  '과도한 욕설',
  '계정 도용 행위',
  '고의트롤, 어뷰징',
  '핵,치트 의심',
];

const CATEGORIES = [
  '협력 유저',
  '소통 원활',
  '실력 중심',
  '즐겜 유저',
  '하드캐리',
  '오더가능',
];

const GAMES = [
  '리그오브레전드',
  '발로란트',
  '오버워치',
  'Steam',
  '로스트아크',
  '메이플 스토리',
  '배틀 그라운드',
];

// 1. 상점 아이템 카테고리 데이터 추가
const ITEM_CATEGORIES = [
  { id: 1, name: 'BADGE', displayName: '뱃지' },
  { id: 2, name: 'NAMEPLATE', displayName: '네임플레이트' },
  { id: 3, name: 'BORDER', displayName: '외곽플레이트' },
  { id: 4, name: 'ICON', displayName: '아이콘' },
];

enum POSITIONS {
  탑 = 101,
  미드 = 102,
  정글 = 103,
  원딜 = 104,
  서폿 = 105,
  타격대 = 201,
  척후대 = 202,
  전략가 = 203,
  감시자 = 204,
  탱커 = 301,
  딜러 = 302,
  힐러 = 303,
}

const TERMS = [
  {
    name: '서비스 이용약관',
    content: readFileSync(
      path.join(__dirname, 'terms', 'service-terms.txt'),
      'utf8',
    ),
    isRequired: true,
  },
  {
    name: '개인정보 수집 및 이용 동의',
    content: readFileSync(
      path.join(__dirname, 'terms', 'privacy-terms.txt'),
      'utf8',
    ),
    isRequired: true,
  },
  {
    name: '마케팅 정보 수신 동의',
    content: readFileSync(
      path.join(__dirname, 'terms', 'marketing-terms.txt'),
      'utf8',
    ),
    isRequired: false,
  },
];

const TIERS = [
  { id: 101, name: '아이언' },
  { id: 102, name: '브론즈' },
  { id: 103, name: '실버' },
  { id: 104, name: '골드' },
  { id: 105, name: '플래티넘' },
  { id: 106, name: '에메랄드' },
  { id: 107, name: '다이아몬드' },
  { id: 108, name: '마스터' },
  { id: 109, name: '그랜드 마스터' },
  { id: 110, name: '챌린저' },
  { id: 201, name: '아이언' },
  { id: 202, name: '브론즈' },
  { id: 203, name: '실버' },
  { id: 204, name: '골드' },
  { id: 205, name: '플래티넘' },
  { id: 206, name: '다이아몬드' },
  { id: 207, name: '초월자' },
  { id: 208, name: '불멸' },
  { id: 209, name: '레디언트' },
  { id: 301, name: '브론즈' },
  { id: 302, name: '실버' },
  { id: 303, name: '골드' },
  { id: 304, name: '플래티넘' },
  { id: 305, name: '다이아몬드' },
  { id: 306, name: '마스터' },
  { id: 307, name: '그랜드마스터' },
  { id: 308, name: '상위 500위' },
  { id: 401, name: '브론즈' },
  { id: 402, name: '실버' },
  { id: 403, name: '골드' },
  { id: 404, name: '플래티넘' },
  { id: 405, name: '크리스탈' },
  { id: 406, name: '다이아몬드' },
  { id: 407, name: '마스터' },
  { id: 408, name: '서바이버' },
];

// ============================================================================
// 마스터 데이터 시드 함수
// ============================================================================

async function seedMasterDataByName(params: {
  model: any;
  names: string[];
  logName: string;
}): Promise<void> {
  const { model, names, logName } = params;
  for (const name of names) {
    await model.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✅ ${logName} 시드 완료 (${names.length}개)`);
}

async function seedMasterDataByEnum(params: {
  model: any;
  enumObject: Record<string, string | number>;
  logName: string;
}): Promise<void> {
  const { model, enumObject, logName } = params;
  const entries = Object.entries(enumObject).filter(
    ([key, value]) => Number.isNaN(Number(key)) && typeof value === 'number',
  );
  for (const [name, id] of entries) {
    await model.upsert({
      where: { name },
      update: {},
      create: { id: BigInt(id), name },
    });
  }
  console.log(`✅ ${logName} 시드 완료 (${entries.length}개)`);
}

async function seedMasterDataByIdAndName(params: {
  model: any;
  rows: { id: number; name: string; displayName?: string }[];
  logName: string;
}): Promise<void> {
  const { model, rows, logName } = params;
  for (const row of rows) {
    await model.upsert({
      where: { id: BigInt(row.id) },
      update: { 
        name: row.name,
        // 2. 상점 카테고리용 displayName 필드가 있을 경우 업데이트
        ...(row.displayName && { displayName: row.displayName })
      },
      create: { 
        id: BigInt(row.id), 
        name: row.name,
        ...(row.displayName && { displayName: row.displayName })
      },
    });
  }
  console.log(`✅ ${logName} 시드 완료 (${rows.length}개)`);
}

async function seedTerms(params: {
  model: any;
  terms: { name: string; content: string; isRequired: boolean }[];
  logName: string;
}): Promise<void> {
  const { model, terms, logName } = params;
  for (const term of terms) {
    await model.upsert({
      where: { name: term.name },
      update: { content: term.content, isRequired: term.isRequired },
      create: { name: term.name, content: term.content, isRequired: term.isRequired },
    });
  }
  console.log(`✅ ${logName} 시드 완료 (${terms.length}개)`);
}

// ----------------------------------------------------------------------------------------------------

async function main() {
  console.log('마스터 데이터 시드 시작...\n');

  await seedMasterDataByName({
    model: prisma.positiveCategory,
    names: POSITIVE_CATEGORIES,
    logName: '긍정 피드백 카테고리',
  });

  await seedMasterDataByName({
    model: prisma.negativeCategory,
    names: NEGATIVE_CATEGORIES,
    logName: '부정 피드백 카테고리',
  });

  await seedMasterDataByName({
    model: prisma.category,
    names: CATEGORIES,
    logName: '카테고리',
  });

  await seedMasterDataByName({
    model: prisma.game,
    names: GAMES,
    logName: '게임',
  });

  await seedMasterDataByEnum({
    model: prisma.position,
    enumObject: POSITIONS,
    logName: '포지션',
  });

  await seedTerms({
    model: prisma.term,
    terms: TERMS,
    logName: '약관',
  });

  await seedMasterDataByIdAndName({
    model: prisma.tier,
    rows: TIERS,
    logName: '티어',
  });

  // 3. 아이템 카테고리 시드 실행 추가
  await seedMasterDataByIdAndName({
    model: prisma.itemCategory,
    rows: ITEM_CATEGORIES,
    logName: '아이템 카테고리',
  });

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