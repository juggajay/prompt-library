import { supabase } from '../lib/supabase';
import type { CreateFolderData, UpdateFolderData, Folder } from '../types';

export async function createFolder(data: CreateFolderData) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: folder, error } = await supabase
    .from('folders')
    .insert({
      name: data.name,
      description: data.description || null,
      color: data.color || null,
      parent_folder_id: data.parent_folder_id || null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return folder as Folder;
}

export async function getFolders() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data as Folder[]) || [];
}

export async function getFolderById(id: string) {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Folder;
}

export async function updateFolder(id: string, updates: UpdateFolderData) {
  const { data, error } = await supabase
    .from('folders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Folder;
}

export async function deleteFolder(id: string) {
  // First, unassign all prompts from this folder
  await supabase
    .from('prompts')
    .update({ folder_id: null })
    .eq('folder_id', id);

  const { error } = await supabase.from('folders').delete().eq('id', id);

  if (error) throw error;
}

export async function getFolderPromptCount(folderId: string) {
  const { count, error } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('folder_id', folderId);

  if (error) throw error;
  return count || 0;
}
