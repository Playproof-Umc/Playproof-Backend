// src/modules/shop/dtos/item.req.dto.ts

export interface CreateItemReqDto {
  category_id: number;
  item_name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_active?: boolean;
}

export interface UpdateItemReqDto {
  price?: number;
  is_active?: boolean;
  item_name?: string;
  description?: string | null;
  image_url?: string | null;
}

export interface ListItemsReqDto {
  page?: number;
  size?: number;
  q?: string | null;
}
