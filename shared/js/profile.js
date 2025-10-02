import { getCurrentUser, signOut } from "../../admin/assets/js/auth/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = await getCurrentUser();

  // حماية الصفحة: إعادة التوجيه إذا لم يكن هناك مستخدم
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  // صورة البروفايل
  const avatarEl = document.getElementById("profile-avatar");
  avatarEl.src = user.user_metadata?.avatar_url ?? "https://via.placeholder.com/100";

  // عنوان رئيسي باسم المستخدم
  const nameEl = document.getElementById("profile-name");
  nameEl.textContent = user.user_metadata?.username ?? "مستخدم مسجل";

  // بيانات إضافية
  document.getElementById("profile-email").textContent = user.email ?? "-";
  document.getElementById("profile-username").textContent = user.user_metadata?.username ?? "-";
  document.getElementById("profile-created").textContent = new Date(user.created_at).toLocaleString("ar-YE");

  // زر تسجيل الخروج
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", async () => {
    await signOut();
    window.location.href = "./login.html"; // إعادة التوجيه بعد الخروج
  });
});
