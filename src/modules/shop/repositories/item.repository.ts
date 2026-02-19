import { singleton } from 'tsyringe';
import { Item, ItemCategory } from '@prisma/client';
import { prisma } from '../../../common/config/database';

@singleton()
export class ItemRepository {
  async createItem(data: {
    categoryId: bigint;
    name: string;
    description?: string | null;
    price?: number | null;
    imageUrl?: string | null;
    isActive?: boolean | null;
  }): Promise<Item> {
    return prisma.item.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        price: data.price ?? null,
        imageUrl: data.imageUrl ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateItem(itemId: bigint, payload: Partial<Item>): Promise<Item> {
    return prisma.item.update({
      where: { id: itemId },
      data: payload,
    });
  }

  async deleteItem(itemId: bigint): Promise<void> {
    await prisma.item.delete({ where: { id: itemId } });
  }

  async findCategoryById(categoryId: bigint): Promise<ItemCategory | null> {
    return prisma.itemCategory.findUnique({ where: { id: categoryId } });
  }

  async findCategories(): Promise<ItemCategory[]> {
    return prisma.itemCategory.findMany({ orderBy: { id: 'asc' } });
  }

  async countItems(where: any = {}): Promise<number> {
    return prisma.item.count({ where });
  }

  async findItemsWithPagination(
    where: any,
    page: number,
    size: number,
  ): Promise<Item[]> {
    const skip = (page - 1) * size;
    return prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: size,
    });
  }

  async findItemById(itemId: bigint): Promise<Item | null> {
    return prisma.item.findUnique({ where: { id: itemId } });
  }
}
