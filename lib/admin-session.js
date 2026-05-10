import { cookies } from 'next/headers';

import { getOptionalEnv } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const ADMIN_ACCESS_COOKIE_NAME = 'rv_admin_access_token';

function decodeJwtExpiration(accessToken) {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

async function isAdminUser(accessToken, userId) {
  if (!accessToken || !userId) {
    return false;
  }

  const supabase = createSupabaseServerClient(accessToken);
  const { data, error } = await supabase
    .from('project_owner')
    .select('owner_user_id')
    .eq('id', true)
    .maybeSingle();

  if (error) {
    return false;
  }

  return data?.owner_user_id === userId;
}

export function isAdminConfigured() {
  return Boolean(
    getOptionalEnv('NEXT_PUBLIC_SUPABASE_URL') &&
    getOptionalEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  );
}

export function getAdminCookieOptions(accessToken) {
  const expiresAt = decodeJwtExpiration(accessToken);
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const maxAge = expiresAt ? Math.max(expiresAt - nowInSeconds, 0) : 60 * 60;

  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export function getExpiredAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };
}

export async function authenticateAdminUser(email, password) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.session || !data.user) {
    throw new Error('Email ou senha invalidos.');
  }

  const allowed = await isAdminUser(data.session.access_token, data.user.id);
  if (!allowed) {
    throw new Error('Este usuario nao tem acesso ao painel.');
  }

  return {
    accessToken: data.session.access_token,
    user: data.user,
  };
}

export async function getAdminUser() {
  if (!isAdminConfigured()) {
    return null;
  }

  const accessToken = cookies().get(ADMIN_ACCESS_COOKIE_NAME)?.value;
  if (!accessToken) {
    return null;
  }

  const expiresAt = decodeJwtExpiration(accessToken);
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (!expiresAt || expiresAt <= nowInSeconds) {
    return null;
  }

  const supabase = createSupabaseServerClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data?.user) {
    return null;
  }

  const allowed = await isAdminUser(accessToken, data.user.id);
  if (!allowed) {
    return null;
  }

  return data.user;
}

export async function hasAdminSession() {
  const user = await getAdminUser();
  return Boolean(user);
}

export async function requireAdminRequest() {
  return hasAdminSession();
}

export function getAdminAccessToken() {
  return cookies().get(ADMIN_ACCESS_COOKIE_NAME)?.value || '';
}
