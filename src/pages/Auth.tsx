import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, phoneToEmail, normalizePhone } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => v.length >= 10 && v.length <= 15, {
      message: 'Informe um telefone válido com DDD (ex: 11999998888).',
    }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
    .max(72, { message: 'A senha deve ter no máximo 72 caracteres.' }),
});

export default function Auth() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (session) navigate('/', { replace: true });
  }, [session, navigate]);

  const run = async (mode: 'signin' | 'signup') => {
    const parsed = schema.safeParse({ phone, password });
    if (!parsed.success) {
      toast({
        title: 'Dados inválidos',
        description: parsed.error.issues[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsBusy(true);
    try {
      const email = phoneToEmail(parsed.data.phone);
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { phone: parsed.data.phone },
          },
        });
        if (error) throw error;
        toast({ title: 'Conta criada!', description: 'Você já pode editar o catálogo.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast({ title: 'Bem-vindo de volta!' });
      }
      navigate('/', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tente novamente.';
      toast({
        title: mode === 'signup' ? 'Erro ao criar conta' : 'Erro ao entrar',
        description: message.includes('Invalid login credentials')
          ? 'Telefone ou senha incorretos.'
          : message,
        variant: 'destructive',
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Acesso ao catálogo</CardTitle>
          <CardDescription>Entre com seu telefone e senha para editar os catálogos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="11999998888"
                  value={phone}
                  maxLength={20}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  maxLength={72}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="signin" className="mt-4">
              <Button className="w-full" disabled={isBusy} onClick={() => run('signin')}>
                {isBusy ? 'Entrando...' : 'Entrar'}
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <Button className="w-full" disabled={isBusy} onClick={() => run('signup')}>
                {isBusy ? 'Criando...' : 'Criar conta'}
              </Button>
            </TabsContent>
          </Tabs>

          <Button variant="ghost" className="mt-4 w-full" onClick={() => navigate('/')}>
            Ver catálogo sem entrar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
