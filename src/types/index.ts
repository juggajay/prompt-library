export const CATEGORIES = [
  'Marketing',
  'Code Generation',
  'Content Writing',
  'Data Analysis',
  'Customer Service',
  'Education',
  'Other'
] as const;

export type Category = typeof CATEGORIES[number];

export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  prompt_text: string;
  description: string | null;
  category: Category;
  tags: string[];
  metadata: Record<string, any>;
  version: number;
  parent_prompt_id: string | null;
  is_favorite: boolean;
  is_public: boolean;
  use_count: number;
  last_used_at: string | null;
  ai_category: string | null;
  ai_tags: string[] | null;
  quality_score: number | null;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptData {
  title: string;
  prompt_text: string;
  description?: string;
  category: Category;
  tags?: string[];
}

export interface UpdatePromptData {
  title?: string;
  prompt_text?: string;
  description?: string;
  category?: Category;
  tags?: string[];
  is_favorite?: boolean;
  is_public?: boolean;
}

export interface PromptFilters {
  category?: Category;
  tags?: string[];
  isFavorite?: boolean;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'use_count';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}
