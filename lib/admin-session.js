import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

import { getOptionalEnv } from '@/lib/env';

export const ADMIN_ACCESS_COOKIE_NAME = 'rv_admin_access_token';

function createSupabaseAuthClient() {
  return createClient(
    getOptionalEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getOptionalEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

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

function getAdminEmails() {
  return getOptionalEnv('ADMIN_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedAdminEmail(email) {
  const allowedEmails = getAdminEmails();
  if (allowedEmails.length === 0) {
    return false;
  }

  return allowedEmails.includes(String(email || '').trim().toLowerCase());
}

export function isAdminConfigured() {
  return Boolean(
    getOptionalEnv('NEXT_PUBLIC_SUPABASE_URL') &&
    getOptionalEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') &&
    getOptionalEnv('SUPABASE_SERVICE_ROLE_KEY') &&
    getAdminEmails().length > 0,
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
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.session || !data.user) {
    throw new Error('Email ou senha invalidos.');
  }

  if (!isAllowedAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
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

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data?.user || !isAllowedAdminEmail(data.user.email)) {
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
