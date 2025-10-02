import { supabase } from '../supabaseClient.js';

const emailForm = document.getElementById('email-login-form');
const loginError = document.getElementById('login-error');
 
emailForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = error.message;
    loginError.classList.remove('hidden');
  } else {
    window.location.href = './dashboard.html'; // إعادة التوجيه بعد تسجيل الدخول
  }
});

// تسجيل الدخول عبر GitHub
document.getElementById('github-login').addEventListener('click', async () => {
  await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin + '/admin/index.html' } });
});

// تسجيل الدخول عبر Google
document.getElementById('google-login').addEventListener('click', async () => {
  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/admin/index.html' } });
});
