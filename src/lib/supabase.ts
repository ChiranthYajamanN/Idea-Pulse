import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnvVar(key: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  return '';
}

function extractCleanCredentials(): { url: string; anonKey: string } {
  let rawUrl = (getEnvVar('VITE_SUPABASE_URL') || '').trim();
  let rawKey = (getEnvVar('VITE_SUPABASE_ANON_KEY') || '').trim();

  // If rawUrl contains both or formatted text like "PROJECT URL: https://..."
  if (rawUrl.includes('https://') && !rawUrl.startsWith('https://')) {
    const urlMatch = rawUrl.match(/https:\/\/[^\s"'<>]+/);
    const keyMatch = rawUrl.match(/eyJ[a-zA-Z0-9_\-\.]+/);
    if (urlMatch) {
      rawUrl = urlMatch[0];
    }
    if (keyMatch && !rawKey) {
      rawKey = keyMatch[0];
    }
  }

  // If rawKey has "ANON_KEY:" prefix
  if (rawKey.includes('eyJ') && !rawKey.startsWith('eyJ')) {
    const keyMatch = rawKey.match(/eyJ[a-zA-Z0-9_\-\.]+/);
    if (keyMatch) {
      rawKey = keyMatch[0];
    }
  }

  return { url: rawUrl, anonKey: rawKey };
}

const { url: cleanUrl, anonKey: cleanKey } = extractCleanCredentials();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    cleanUrl &&
    cleanKey &&
    cleanUrl.startsWith('https://') &&
    !cleanUrl.includes('your-project')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
