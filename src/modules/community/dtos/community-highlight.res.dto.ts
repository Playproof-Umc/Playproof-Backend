// 1. 하이라이트(커뮤니티) 상세 조회
export class CommunityHighlightResDto {
  highlight_id!: number;
  user_id!: number;
  nickname!: string;
  profileUrl!: string | null;
  content!: string;
  medias!: string[];
  
  // 아지트 정보가 없으면 커뮤니티(하이라이트)
  azit?: {
    azit_id: number;
    name: string;
  } | null;

  comment_count!: number;
  like_count!: number;
  is_liked!: boolean;
  created_at!: string;
  updated_at!: string;
}

// 2. 커뮤니티(하이라이트) 목록 조회
export class CommunityHighlightListResDto {
  highlights!: CommunityHighlightResDto[];
  meta!: {
    total_count: number;
    current_page: number;
    total_pages: number;
    has_next_page: boolean;
  };
}

// 3. 하이라이트 생성 및 조회 응답 DTO
export class CommunityHighlightUpdateResDto {
  highlight_id!: number;
  content!: string;
  medias!: string[];
  is_public!: boolean;
  updated_at!: string;
}

// 4. 하이라이트 삭제
export class CommunityHighlightDeleteResDto {
  highlight_id!: number;
  message!: string;
  deleted_at!: string;
}