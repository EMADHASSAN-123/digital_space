// assets/js/auth/guards.js
import { supabase } from '../supabaseClient.js';

export async function protectAdminPage(redirectIfLoggedOut = true) {
  const { data: { session } } = await supabase.auth.getSession();
 
  if (!session && redirectIfLoggedOut) {
    // إذا لم يكن المستخدم مسجّل الدخول، تحويله لصفحة login
    window.location.href = '../shared/login.html';
    return false;
  }

  return session ? session.user : null;
}

// ي مكن استدعاؤه في login.html للتحويل التلقائي إذا المستخدم مسجّل بالفعل
export async function redirectIfLoggedIn() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = './index.html';
  }
}
