// analyticsApi.js
// يستخدم log-visit Edge Function ويدعم الحصول على إحصائيات

import { SUPABASE_URL, SUPABASE_ANON_KEY, supabase } from '../supabaseClient.js';

/**
 * الحصول على Access Token من الجلسة الحالية
 */
async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch (e) {
    return null;
  }
}

/**
 * تسجيل زيارة صفحة (log visit)
 * @param {Object} params - page_url, referrer, visitor_id, user_id
 */
export async function logVisit({ page_url, referrer = '', visitor_id, user_id = null } = {}) {
  try {
    if (!page_url || !visitor_id) throw new Error('Missing page_url or visitor_id');

    const url = `${SUPABASE_URL}/functions/v1/log-visit`;
    const token = await getAccessToken();

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Accept': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ page_url, referrer, visitor_id, user_id })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('logVisit failed', body);
      return { success: false, body };
    }

    return { success: !!body?.success, deduped: !!body?.deduped, raw: body };
  } catch (e) {
    console.error('logVisit error', e);
    return { success: false, error: e.message || e };
  }
}

/**
 * الحصول على ملخص إحصائيات الزيارات
 * مثال: يمكن لاحقًا تعديل الدالة لطلب إحصائيات حقيقية من Edge Function أو Supabase
 */
export async function getOverview() {
  try {
    // const url = `${SUPABASE_URL}/functions/v1/get-overview`;
    const token = await getAccessToken();

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Accept': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { method: 'GET', headers });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('getOverview failed', body);
      return { success: false, body };
    }

    return { success: true, data: body };
  } catch (e) {
    console.error('getOverview error', e);
    return { success: false, error: e.message || e };
  }
}
