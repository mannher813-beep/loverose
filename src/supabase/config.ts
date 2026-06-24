import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Flag to check if real Supabase services should be used
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.log('💡 Supabase is not yet configured. The app is running with Firestore fallback to keep things interactive. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your settings to connect real Supabase services!');
}

// Ensure createClient doesn't throw on missing/invalid URL during init
const actualUrl = supabaseUrl || 'https://placeholder-project-id.supabase.co';
const actualKey = supabaseAnonKey || 'placeholder-anon-key-please-configure-in-settings';

export const supabase = createClient(actualUrl, actualKey, {
  auth: {
    persistSession: false, // We use Firebase for Auth as requested by the user
  }
});
