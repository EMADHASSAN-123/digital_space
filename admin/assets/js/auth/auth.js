// auth.js
import { supabase } from '../supabaseClient.js';
import { SUPABASE_ANON_KEY } from "../supabaseClient.js";

/* ---------- الحصول على المستخدم الحالي ---------- */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("getCurrentUser error:", error.message);
    return null;
  }
  return data?.user ?? null;
}

/* ---------- تسجيل الخروج ---------- */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("signOut error:", error.message);
    throw new Error("فشل تسجيل الخروج");
  }
  return true;
}

/* ---------- الحصول على توكن الوصول ---------- */
export async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("getAccessToken warning:", error.message);
    return null;
  }
  const session = data?.session ?? null;
  return session?.access_token ?? null;
}

/* ---------- تهيئة Authorization Header ---------- */
export async function getAuthHeader(requireLogin = false) {
  const token = await getAccessToken();
  if (token) {
    return `Bearer ${token}`;
  }
  if (requireLogin) throw new Error("Unauthorized: يرجى تسجيل الدخول");
  return `Bearer ${SUPABASE_ANON_KEY}`; // fallback للمستخدم الزائر
}

/* ---------- تسجيل حساب جديد عبر البريد ---------- */
export async function signUpWithEmail(email, password) {
  if (!email || !password) throw new Error("البريد الإلكتروني وكلمة المرور مطلوبة");
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "تم إرسال رابط التفعيل إلى بريدك الإلكتروني",
    user: data.user ?? null,
  };
}
 
/* ---------- تسجيل الدخول عبر البريد ---------- */
export async function signInWithEmail(email, password) {
  if (!email || !password) throw new Error("البريد الإلكتروني وكلمة المرور مطلوبة");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "تم تسجيل الدخول بنجاح",
    user: data.user ?? null,
  };
}

/* ---------- إرسال رابط تسجيل الدخول عبر البريد (Magic Link) ---------- */
export async function signInWithMagicLink(email) {
  if (!email) throw new Error("البريد الإلكتروني مطلوب");
  const { data, error } = await supabase.auth.signInWithOtp({ email });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "تم إرسال رابط تسجيل الدخول إلى بريدك الإلكتروني",
    user: data.user ?? null,
  };
}
