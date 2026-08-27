import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Base Supabase client with Anon Key
export const supabase = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_ANON_KEY || 'placeholder'
);

// Admin Supabase client with Service Role Key (if provided)
export const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  : supabase;

// Helper to create an authenticated Supabase client using user JWT
export const getAuthenticatedSupabaseClient = (accessToken: string) => {
  return createClient(
    env.SUPABASE_URL || 'https://placeholder.supabase.co',
    env.SUPABASE_ANON_KEY || 'placeholder',
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
};
