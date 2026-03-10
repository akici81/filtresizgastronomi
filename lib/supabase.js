import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper: Kullanıcı rolünü kontrol et
export async function getUserRole(userId) {
  if (!userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role || 'user';
}

// Helper: Admin mi?
export async function isAdmin(userId) {
  const role = await getUserRole(userId);
  return ['superadmin', 'admin'].includes(role);
}

// Helper: Editor veya üstü mü?
export async function isEditorOrAbove(userId) {
  const role = await getUserRole(userId);
  return ['superadmin', 'admin', 'editor'].includes(role);
}

// Helper: Storage URL oluştur
export function getStorageUrl(bucket, path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}