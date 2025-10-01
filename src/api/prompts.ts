import { supabase } from '../lib/supabase';
import type { CreatePromptData, UpdatePromptData, PromptFilters, Prompt } from '../types';

export async function createPrompt(data: CreatePromptData) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // @ts-ignore - Supabase type inference issue
  const { data: prompt, error } = await supabase
    .from('prompts')
    .insert({
      title: data.title,
      prompt_text: data.prompt_text,
      description: data.description || null,
      category: data.category,
      tags: data.tags || [],
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return prompt as Prompt;
}

export async function getPrompts(filters: PromptFilters = {}) {
  const {
    category,
    tags,
    isFavorite,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20,
  } = filters;

  let query = supabase.from('prompts').select('*', { count: 'exact' });

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  if (isFavorite) {
    query = query.eq('is_favorite', true);
  }

  if (search) {
    query = query.textSearch('search_vector', search, {
      type: 'websearch',
      config: 'english',
    });
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    prompts: (data as Prompt[]) || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getPromptById(id: string) {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Prompt;
}

export async function updatePrompt(id: string, updates: UpdatePromptData) {
  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Prompt;
}

export async function deletePrompt(id: string) {
  const { error } = await supabase.from('prompts').delete().eq('id', id);

  if (error) throw error;
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('prompts')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Prompt;
}

export async function incrementUsage(id: string) {
  // @ts-ignore - Supabase type inference issue
  const { error } = await supabase.rpc('increment_usage', {
    prompt_id: id,
  });

  if (error) throw error;
}

export async function semanticSearch(query: string, limit = 10) {
  // Note: This requires the embedding to be generated for the search query
  // This would typically be done through an API route that calls OpenAI
  // For now, we'll use text search as a fallback
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .textSearch('search_vector', query)
    .limit(limit);

  if (error) throw error;
  return data as Prompt[];
}
