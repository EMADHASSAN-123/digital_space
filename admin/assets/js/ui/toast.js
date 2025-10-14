// toast.js
export function showToast(msg, { timeout = 3000 } = {}) {
  const root = document.getElementById('toastRoot') || document.body;
  const t = document.createElement('div');
  t.className = 'p-2 rounded shadow my-2 bg-gray-800 text-white';
  t.textContent = msg;
  root.appendChild(t); 
  setTimeout(() => t.remove(), timeout); 
}
   