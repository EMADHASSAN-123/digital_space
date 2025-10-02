// modal.js - نافذة تأكيد بسيطة (تعيد Promise)
export function confirmDialog({ title = 'تأكيد', text = 'هل أنت متأكد؟' } = {}) {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 flex items-center justify-center bg-black/50 z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm w-full">
        <h3 class="font-bold mb-2">${title}</h3>
        <p class="mb-4">${text}</p>
        <div class="flex justify-end gap-2">
          <button id="noBtn" class="px-3 py-1 rounded bg-gray-200">إلغاء</button>
          <button id="yesBtn" class="px-3 py-1 rounded bg-indigo-600 text-white">نعم</button>
        </div>
      </div>
    `; 
    document.body.appendChild(modal);
    modal.querySelector('#noBtn').onclick = () => { modal.remove(); resolve(false); };
    modal.querySelector('#yesBtn').onclick = () => { modal.remove(); resolve(true); };
  });
}
 