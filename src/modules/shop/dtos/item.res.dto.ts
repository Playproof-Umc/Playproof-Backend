// src/modules/shop/dtos/item.res.dto.ts

export interface CreateItemResDto {
  item_id: number;
  message: string;
}

export interface UpdateItemResDto {
  message: string;
}

export interface DeleteItemResDto {
  message: string;
}

export interface CategoryItem {
  category_id: number;
  category_name: string | null;
  display_name: string | null;
}

export interface CategoriesResDto {
  categories: CategoryItem[];
}

export interface ItemSummary {
  item_id: number;
  category_id: number;
  item_name: string;
  price: number | null;
  image_url?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
}

export interface ItemsMeta {
  total_count: number;
  current_page: number;
  total_pages: number;
  has_next_page: boolean;
}

export interface ListItemsResDto {
  items: ItemSummary[];
  meta: ItemsMeta;
}

export interface ItemDetailResDto {
  item: {
    item_id: number;
    category_id: number;
    item_name: string;
    description?: string | null;
    price?: number | null;
    image_url?: string | null;
    is_active?: boolean | null;
    created_at?: string | null;
  };
}
