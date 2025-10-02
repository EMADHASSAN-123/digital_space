// auth helper
import { supabase } from '../supabaseClient.js';
import { SUPABASE_ANON_KEY } from "../supabaseClient.js";
 
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return data?.user ?? null;
}
  
export async function signOut() {
  await supabase.auth.signOut();
}  

 
export async function getAccessToken() {
  // supabase.auth.getSession() يعيد { data: { session } }
  const { data } = await supabase.auth.getSession();
  const session = data?.session ?? null;
  return session?.access_token ?? null;
}

export async function getAuthHeader() {
  const token = await getAccessToken();
   if (token) {
    // مستخدم مسجل دخول
    return `Bearer ${token}`;
  }
  // fallback: مستخدم غير مسجل دخول → استخدم anon key
  return `Bearer ${SUPABASE_ANON_KEY}`;
}

