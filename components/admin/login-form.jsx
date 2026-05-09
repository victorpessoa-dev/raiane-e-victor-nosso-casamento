'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getUserMessage } from '@/lib/get-user-message';

export function LoginForm({ configured }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/admin');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await login(email, password);

    if (result.success) {
      toast({
        title: 'Login realizado com sucesso!',
      });
    } else {
      toast({
        variant: 'destructive',
        title: getUserMessage(result.error, 'Nao foi possivel entrar agora.'),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(160deg, #ffffff 0%, #fdf2f4 50%, #ffffff 100%)' }}
    >
      <div className="w-full max-w-sm text-center animate-slide-up">
        <div className="mb-6 flex justify-center animate-float">
          <Image src="/brasao 2x bg.png" alt="R & V" width={100} height={115} className="object-contain" />
        </div>
        <h1 className="mb-1 font-playfair text-3xl text-burgundy-800">Area Restrita</h1>
        <p className="mb-2 font-lato text-sm tracking-wide text-muted-foreground">Administracao - R &amp; V</p>
        <p className="mb-8 font-lato text-xs text-burgundy-400">Usque Ad Caelum</p>

        <Card className="border-zinc-200 bg-white shadow-md">
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-left text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-10"
                    required
                    disabled={!configured}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-left text-sm font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-10"
                    required
                    disabled={!configured}
                  />
                </div>
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={!configured}>
                Entrar
              </Button>

              <p className="mt-2 text-center text-xs text-muted-foreground">
                Acesso Admin
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
