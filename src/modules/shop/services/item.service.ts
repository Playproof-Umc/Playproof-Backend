import { inject, injectable } from 'tsyringe';
import { ItemRepository } from '../repositories/item.repository';
import {
  CreateItemReqDto,
  UpdateItemReqDto,
  ListItemsReqDto,
} from '../dtos/item.req.dto';
import {
  CreateItemResDto,
  UpdateItemResDto,
  DeleteItemResDto,
  CategoriesResDto,
  ListItemsResDto,
  ItemDetailResDto,
} from '../dtos/item.res.dto';
import { ResultChain } from '../../../common/types/result.chain';
import { ok, created, notFound, ok as okResp } from '../../../common/types/result.type';
import { uploadFileToS3 } from '../../../common/utils/file-util';
import { checkCategoryExists, checkItemExists } from '../utills/item.validator';

@injectable()
export class ItemService {
  constructor(@inject(ItemRepository) private itemRepository: ItemRepository) {}

  async createItem(dto: CreateItemReqDto, file?: Express.Multer.File): Promise<any> {
    return await ResultChain.of(dto)
      .flatThenAsync(checkCategoryExists(this.itemRepository))
      .flatThenAsync(async (data) => {
        let imageUrl = data.image_url ?? null;
        if (file) {
          const uploadResult = await uploadFileToS3(file, 'shop-items');
          if (uploadResult.error) return uploadResult;
          imageUrl = uploadResult.data;
        }

        const createdItem = await this.itemRepository.createItem({
          categoryId: BigInt(data.category_id),
          name: data.item_name,
          description: data.description ?? null,
          price: data.price ?? null,
          imageUrl: imageUrl ?? null,
          isActive: data.is_active ?? true,
        });
        return created({ item_id: Number(createdItem.id), message: '아이템이 성공적으로 등록되었습니다.' } as CreateItemResDto);
      })
      .getResult();
  }

  async updateItem(dto: { itemId: number } & UpdateItemReqDto): Promise<any> {
    return await ResultChain.of(dto)
      .flatThenAsync(checkItemExists(this.itemRepository))
      .flatThenAsync(async (data) => {
        const payload: any = {};
        if (typeof data.price !== 'undefined') payload.price = data.price;
        if (typeof data.is_active !== 'undefined') payload.isActive = data.is_active;
        if (typeof data.item_name !== 'undefined') payload.name = data.item_name;
        if (typeof data.description !== 'undefined') payload.description = data.description;
        if (typeof data.image_url !== 'undefined') payload.imageUrl = data.image_url;

        await this.itemRepository.updateItem(BigInt(data.itemId), payload);
        return ok({ message: '아이템 정보가 수정되었습니다.' } as UpdateItemResDto);
      })
      .getResult();
  }

  async deleteItem(dto: { itemId: number }): Promise<any> {
    return await ResultChain.of(dto)
      .flatThenAsync(checkItemExists(this.itemRepository))
      .flatThenAsync(async (data) => {
        await this.itemRepository.deleteItem(BigInt(data.itemId));
        return ok({ message: '아이템이 성공적으로 삭제되었습니다.' } as DeleteItemResDto);
      })
      .getResult();
  }

  async getCategories(): Promise<any> {
    const categories = await this.itemRepository.findCategories();
    return ok({ categories: categories.map((c) => ({ category_id: Number(c.id), category_name: c.name, display_name: c.displayName })) } as CategoriesResDto);
  }

  async listItems(dto: ListItemsReqDto): Promise<any> {
    const page = dto.page && dto.page > 0 ? dto.page : 1;
    const size = dto.size && dto.size > 0 ? dto.size : 10;
    const where: any = {};
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
      ];
    }
    const total = await this.itemRepository.countItems(where);
    const items = await this.itemRepository.findItemsWithPagination(where, page, size);
    const totalPages = Math.ceil(total / size);
    return ok({ items: items.map((it) => ({ item_id: Number(it.id), category_id: Number(it.categoryId), item_name: it.name, price: it.price ?? null, image_url: it.imageUrl ?? null, is_active: it.isActive ?? null, created_at: it.createdAt?.toISOString() ?? null })), meta: { total_count: total, current_page: page, total_pages: totalPages, has_next_page: page < totalPages } } as ListItemsResDto);
  }

  async getItemDetail(dto: { itemId: number }): Promise<any> {
    return await ResultChain.of(dto)
      .flatThenAsync(checkItemExists(this.itemRepository))
      .flatThenAsync(async (data) => {
        const item = await this.itemRepository.findItemById(BigInt(data.itemId));
        return ok({ item: { item_id: Number(item!.id), category_id: Number(item!.categoryId), item_name: item!.name, description: item!.description ?? null, price: item!.price ?? null, image_url: item!.imageUrl ?? null, is_active: item!.isActive ?? null, created_at: item!.createdAt?.toISOString() ?? null } } as ItemDetailResDto);
      })
      .getResult();
  }
}
