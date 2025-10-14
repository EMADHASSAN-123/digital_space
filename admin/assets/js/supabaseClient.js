// supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ضع المتغيّرات الحقيقية أثناء النشر (لا تحفظ service role في الواجهة الأمامية)
export const SUPABASE_URL = 'https://ugswbpfwmaoztigppacu.supabase.co';
export const SUPABASE_ANON_KEY ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3dicGZ3bWFvenRpZ3BwYWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzQ5MzMsImV4cCI6MjA3NTM1MDkzM30.4Y3q7X1QxwbebB_9kzOI1chEaoPsrO8HXRW1kdcXvjU';

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibm56bWhvcGNqbGt2dHV1YmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTAyODQsImV4cCI6MjA2OTgyNjI4NH0.GmnvUTPeDKNtc2LEEK-9N47LgE3gJ7PbPiWI1l2X_R8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 