import { createClient } from '@supabase/supabase-js';

import { getOptionalEnv, getRequiredEnv } from '@/lib/env';

export function createSupabaseServerClient(accessToken) {
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  };

  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    options,
  );
}

export function createSupabaseServiceClient() {
  const serviceRoleKey = getOptionalEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    return null;
  }

  return createClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
