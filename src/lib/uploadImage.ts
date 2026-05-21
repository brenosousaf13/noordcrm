import { supabase } from './supabase'

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `documents/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('document-images')
    .upload(path, file)
  if (error) throw error
  const { data: urlData } = supabase.storage
    .from('document-images')
    .getPublicUrl(data.path)
  return urlData.publicUrl
}
