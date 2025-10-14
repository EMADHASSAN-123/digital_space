// التعامل مع Edge Functions للموارد
// مبدأ SRP: كل دالة لها وظيفة واحدة 
import { getAuthHeader } from "../auth/auth.js"; 
import { SUPABASE_URL } from "../supabaseClient.js";
import { showError, showSuccess, showLoading, hideLoading } from "../ui/notifications.js";

const API_BASE = `${SUPABASE_URL}/functions/v1/`;
// الجلب get-resources
//الاضافة add-resource
//الحذف delete-resource
// التعديل update-resource
 

// --- دوال مساعدة ---
async function request(url, method = "GET", body = null, auth = false) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const authHeader = await getAuthHeader(); // من auth.js
    if (authHeader) headers["Authorization"] = authHeader;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "خطأ في الخادم");
    return data;
  } finally {
    hideLoading();
  }
}


// --- CRUD Operations ---

// جلب الموارد (لا يحتاج مصادقة)
export async function getResources() {
  try {
    const data = await request(`${API_BASE}`+"get-resources", "GET");
    return data.resources || [];
  } catch (err) {
    showError(err.message);
    return [];
  }
}
 
// إضافة مورد جديد (يتطلب مصادقة + Admin)
export async function addResource(resource) {
  try {
    const data = await request(`${API_BASE}`+"add-resourse", "POST", resource, true);
    showSuccess("تمت إضافة المورد بنجاح");
    return data.resource;
  } catch (err) {
    showError(err.message);
    throw err;
  }
}

// تحديث مورد
export async function updateResource(id, resource) {
  try {
        const body = { id, ...resource };


    const data = await request(`${API_BASE}update-resource`, "PUT", body, true);
    showSuccess("تم تعديل المورد بنجاح");
    return data.resource;
  } catch (err) {
    showError(err.message);
    throw err;
  }
}

// حذف مورد
export async function deleteResource(id) {
  try {
    await request(`${API_BASE}delete-resource`, "DELETE",  {id} , true);
    showSuccess("تم حذف المورد بنجاح");
    return true;
  } catch (err) { 
    showError(err.message);
    throw err;
  }
}