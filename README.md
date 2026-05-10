# nosso-casamento

Aplicacao Next.js para receber fotos e videos do casamento, com moderacao via painel admin e armazenamento no Supabase.

## Ambiente

Preencha o `.env` com:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase

Rode o SQL de [`supabase/setup.sql`](/C:/Users/victo/Documents/Pessoal/Jose.Pessoa/Projetos/github/raiane-e-victor-nosso-casamento/supabase/setup.sql:1) no SQL Editor do Supabase. Ele cria:

- tabela `media_uploads`
- tabela `project_owner`
- bucket privado `wedding-media`
- politicas publicas para upload e carrossel
- vinculo automatico de cada upload ao dono do projeto
- politicas de admin baseadas no usuario dono do Supabase Auth

## Como definir o dono do projeto

1. Crie o usuario em `Authentication > Users` no painel do Supabase.
2. Copie o `UUID` desse usuario.
3. Rode este SQL trocando o UUID:

```sql
insert into public.project_owner (id, owner_user_id)
values (true, 'UUID_DO_USUARIO')
on conflict (id) do update
set owner_user_id = excluded.owner_user_id,
    updated_at = now();

update public.media_uploads
set owner_user_id = 'UUID_DO_USUARIO'
where owner_user_id is null;
```
