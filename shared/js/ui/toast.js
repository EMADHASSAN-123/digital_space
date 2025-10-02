export function showToast(msg, { type = "info", timeout = 3000 } = {}) {
  const root = document.getElementById("toastRoot") || document.body;
  const t = document.createElement("div");

  // ستايلات أساسية
  t.className = "p-3 rounded shadow my-2 text-white w-fit animate-fade-in";

  // ألوان حسب نوع الرسالة
  switch (type) {
    case "success":
      t.classList.add("bg-green-600");
      break;
    case "error":
      t.classList.add("bg-red-600");
      break;
    default:
      t.classList.add("bg-gray-800");
  }

  t.textContent = msg;
  root.appendChild(t);

  setTimeout(() => {
    t.classList.add("animate-fade-out");
    setTimeout(() => t.remove(), 500); // بعد الانيميشن
  }, timeout);
}