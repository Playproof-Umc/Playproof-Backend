import { ItemRepository } from '../repositories/item.repository';
import { Result, notFound, ok } from '../../../common/types/result.type';

export const checkCategoryExists = (repo: ItemRepository) => async (dto: any): Promise<Result<any>> => {
  const category = await repo.findCategoryById(BigInt(dto.category_id));
  if (!category) return notFound({ message: '카테고리를 찾을 수 없습니다.' });
  return ok(dto);
};

export const checkItemExists = (repo: ItemRepository) => async (dto: any): Promise<Result<any>> => {
  const item = await repo.findItemById(BigInt(dto.itemId));
  if (!item) return notFound({ message: '아이템을 찾을 수 없습니다.' });
  return ok(dto);
};
