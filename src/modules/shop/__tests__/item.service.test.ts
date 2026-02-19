import { ItemService } from '../services/item.service';
import { ItemRepository } from '../repositories/item.repository';
import { isSuccess } from '../../../common/types/result.type';

describe('ItemService', () => {
  let svc: ItemService;
  let repo: jest.Mocked<ItemRepository>;

  beforeEach(() => {
    repo = {
      createItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      findCategoryById: jest.fn(),
      findCategories: jest.fn(),
      countItems: jest.fn(),
      findItemsWithPagination: jest.fn(),
      findItemById: jest.fn(),
    } as any;
    svc = new ItemService(repo as unknown as ItemRepository);
    jest.clearAllMocks();
  });

  describe('createItem', () => {
    it('성공: 아이템 생성', async () => {
      repo.findCategoryById.mockResolvedValue({ id: BigInt(4), name: 'ICON', displayName: '아이콘' } as any);
      repo.createItem.mockResolvedValue({ id: BigInt(103) } as any);

      const res = await svc.createItem({ category_id: 4, item_name: '불타는 해골 아이콘', description: 'desc', price: 1500, image_url: 'https://x', is_active: true });

      expect(res.statusCode).toBe(201);
      if (isSuccess(res)) expect((res as any).data.item_id).toBe(103);
      expect(repo.findCategoryById).toHaveBeenCalledWith(BigInt(4));
      expect(repo.createItem).toHaveBeenCalled();
    });

    it('실패: 카테고리 없음', async () => {
      repo.findCategoryById.mockResolvedValue(null as any);
      const res = await svc.createItem({ category_id: 999, item_name: 'x', price: 100, description: null as any, image_url: null as any, is_active: true });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('updateItem', () => {
    it('성공: 아이템 수정', async () => {
      repo.findItemById.mockResolvedValue({ id: BigInt(101) } as any);
      repo.updateItem.mockResolvedValue({ id: BigInt(101) } as any);

      const res = await svc.updateItem({ itemId: 101, price: 1200, is_active: false });

      expect(res.statusCode).toBe(200);
      if (isSuccess(res)) expect((res as any).data.message).toMatch(/수정/);
      expect(repo.findItemById).toHaveBeenCalledWith(BigInt(101));
      expect(repo.updateItem).toHaveBeenCalledWith(BigInt(101), expect.any(Object));
    });

    it('실패: 아이템 없음', async () => {
      repo.findItemById.mockResolvedValue(null as any);
      const res = await svc.updateItem({ itemId: 9999, price: 1200 });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('deleteItem', () => {
    it('성공: 아이템 삭제', async () => {
      repo.findItemById.mockResolvedValue({ id: BigInt(102) } as any);
      repo.deleteItem.mockResolvedValue();

      const res = await svc.deleteItem({ itemId: 102 });

      expect(res.statusCode).toBe(200);
      if (isSuccess(res)) expect((res as any).data.message).toMatch(/삭제/);
      expect(repo.deleteItem).toHaveBeenCalledWith(BigInt(102));
    });
  });

  describe('getCategories', () => {
    it('성공: 카테고리 목록 반환', async () => {
      repo.findCategories.mockResolvedValue([
        { id: BigInt(1), name: 'BADGE', displayName: '뱃지' },
      ] as any);

      const res = await svc.getCategories();
      expect(res.statusCode).toBe(200);
      if (isSuccess(res)) expect((res as any).data.categories[0].display_name).toBe('뱃지');
    });
  });

  describe('listItems', () => {
    it('성공: 아이템 목록과 메타 반환', async () => {
      const mockItems = Array(2).fill(0).map((_, i) => ({ id: BigInt(101 + i), categoryId: BigInt(2), name: `item${i}`, price: 100 * i, imageUrl: null, isActive: true, createdAt: new Date() }));
      repo.countItems.mockResolvedValue(80 as any);
      repo.findItemsWithPagination.mockResolvedValue(mockItems as any);

      const res = await svc.listItems({ page: 1, size: 10 });
      expect(res.statusCode).toBe(200);
      if (isSuccess(res)) {
        expect((res as any).data.items).toHaveLength(2);
        expect((res as any).data.meta.total_count).toBe(80);
        expect((res as any).data.meta.current_page).toBe(1);
      }
    });
  });

  describe('getItemDetail', () => {
    it('성공: 상세 반환', async () => {
      repo.findItemById.mockResolvedValue({ id: BigInt(101), categoryId: BigInt(2), name: 'gold', description: 'desc', price: 3000, imageUrl: 'x', isActive: true, createdAt: new Date() } as any);
      const res = await svc.getItemDetail({ itemId: 101 });
      expect(res.statusCode).toBe(200);
      if (isSuccess(res)) expect((res as any).data.item.item_id).toBe(101);
    });

    it('실패: 아이템 없음', async () => {
      repo.findItemById.mockResolvedValue(null as any);
      const res = await svc.getItemDetail({ itemId: 9999 });
      expect(res.statusCode).toBe(404);
    });
  });
});

