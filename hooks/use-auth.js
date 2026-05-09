'use client';

import { useCallback, useEffect, useState } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/session', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setIsAuthenticated(false);
        return { success: false, error: payload.error || 'Sessao invalida.' };
      }

      setIsAuthenticated(Boolean(payload.authenticated));
      return { success: Boolean(payload.authenticated), user: payload.user || null };
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setIsAuthenticated(false);
        return { success: false, error: payload.error || 'Falha ao autenticar.' };
      }

      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      setIsAuthenticated(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao autenticar.',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
  }, []);

  return {
    login,
    logout,
    isAuthenticated,
    isLoading,
    refreshSession,
  };
}
