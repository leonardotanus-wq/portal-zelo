# STATUS — Zelo Portal

## 🆕 Mudanças desta rodada (2026-05-03)

### Home da revenda — 6 botões reordenados
- 4 dos 6 botões agora apontam para pastas do **Google Drive** e abrem em nova aba (`target="_blank" rel="noopener noreferrer"`).
- Nova ordem: Pedir Orçamento → Comprar Peças → **Vídeos e Fotos que estão Bombando!!!** (com badge "🔥 NOVO" e `ring-2 ring-zelo-yellow`) → Modelos de Proposta → Manuais e PDFs → Vídeos e Fotos Diversas.
- Ícones: `ShoppingCart`, `Wrench`, `Flame`, `FileText`, `BookOpen`, `Images` (todos `lucide-react`).

### Página `/materiais` removida
- Pastas deletadas: `src/app/(auth)/materiais/` e `src/app/admin/(panel)/materiais/`.
- Item "Materiais" removido da `AdminSidebar` (`src/components/admin-sidebar.tsx`).
- Card "Materiais cadastrados" removido do dashboard admin (`src/app/admin/(panel)/page.tsx`) — agora 3 cards.
- Tipos `Material`, `CategoriaMaterial`, `CATEGORIAS_MATERIAL` removidos de `src/lib/types.ts` (não eram mais referenciados).
- ⚠️ A tabela `materiais` e o bucket `materiais` no Supabase **foram preservados** (não dropados).

### Email automático no upload de vídeo (Resend)
- Pacote `resend@^6.12.2` adicionado ao `package.json`.
- Novo módulo `src/lib/email.ts` com `enviarEmailNovoVideo(payload)`:
  - Inicializa `Resend(process.env.RESEND_API_KEY)`.
  - Envia HTML responsivo (com botão amarelo "Ver no painel admin" → `/admin/videos`).
  - **Timeout de 5s** (`Promise.race` interno) — não bloqueia o upload.
  - **Try/catch global** — falha de envio é logada mas NÃO quebra o fluxo do upload.
  - Se `RESEND_API_KEY` ainda for o placeholder, faz `console.log` e retorna sem enviar.
- `src/app/(auth)/upload-video/actions.ts` chama `enviarEmailNovoVideo()` após o `INSERT` em `videos_instalacao`.
- Novas env vars em `.env.local` (placeholders — o usuário precisa trocar):
  - `RESEND_API_KEY=re_xxxxx_PLACEHOLDER`
  - `EMAIL_ADMIN=leonardo.tanus@zeloprotege.com`
  - `EMAIL_FROM=Zelo Portal <onboarding@resend.dev>` (funciona em modo teste sem domínio verificado)

### Validação
- `pnpm build` passa sem erros (11 rotas, materiais sumiu como esperado).

### Ações pendentes para o usuário (esta rodada)
1. Criar conta em <https://resend.com> e gerar uma API key (`re_…`).
2. Substituir `RESEND_API_KEY` no `.env.local` pela chave real.
3. (Opcional) Verificar um domínio próprio na Resend e trocar `EMAIL_FROM` para algo como `Zelo Portal <noreply@seudominio.com>`. Sem isso, o `onboarding@resend.dev` só envia para o email cadastrado na conta Resend.
4. Quando subir pra Vercel, replicar `RESEND_API_KEY`, `EMAIL_ADMIN` e `EMAIL_FROM` em Production/Preview/Development.

---

## ✅ Concluído

### Setup do projeto
- Next.js 16 (App Router, TypeScript strict, Tailwind v4) com Turbopack
- shadcn/ui (Base UI) instalado: Button, Input, Label, Card, Dialog, Tabs, RadioGroup, Textarea, Badge, Sonner
- Cores Zelo (`zelo-yellow`, `zelo-dark`, etc.) declaradas em `src/app/globals.css` (Tailwind v4 usa `@theme inline`)
- Fonte Inter configurada em `src/app/layout.tsx`
- `.env.local` com as três variáveis Supabase
- Logos SVG placeholder em `/public/logo.svg` e `/public/logo-white.svg`

### Supabase + middleware
- `src/lib/supabase/{client,server,admin,middleware}.ts`
- `src/middleware.ts` protege rotas:
  - `/` e `/admin/login` públicas
  - `/admin/*` exige email cadastrado em `admins`
  - Demais rotas exigem usuário autenticado
- Tipagem central em `src/lib/types.ts`, helpers em `src/lib/auth.ts` e `src/lib/format.ts`

### Página pública
- `src/lib/rss.ts` puxa 5 feeds em paralelo, normaliza, deduplica, ordena, limita a 30 e cacheia 30 min com `unstable_cache`
- `src/app/(public)/page.tsx` com hero escuro + box de login destacado + grid de notícias (Suspense + skeleton)
- Login da revenda: Server Action `loginRevenda` em `src/app/(public)/actions.ts` (transforma `usuario` em `usuario@revenda.zelo.local`)

### Área logada (revenda)
- `src/app/(auth)/layout.tsx` com header autenticado + botão sair
- `/home`: banner amarelo de upload de vídeo + grid de 6 cards
- `/orcamento`: formulário largura/altura/material/cor (com "Outra") → WhatsApp
- `/pecas`: descrição + urgência → WhatsApp
- `/materiais`: tabs por categoria (proposta/video/foto/manual) + cards com download
- `/upload-video`: upload direto pro Supabase Storage (até 100 MB) + listagem dos próprios vídeos com badge de status

### Área admin
- `/admin/login`: form email + senha, valida que o usuário está em `admins`
- `/admin/(panel)/`: layout com sidebar (Dashboard, Revendas, Materiais, Vídeos, Sair)
- `/admin`: dashboard com 4 contadores
- `/admin/revendas`: CRUD completo (Dialog para criar/editar, toggle ativa/inativa)
  - `POST /api/admin/criar-revenda` cria usuário no Supabase Auth com `service_role` + insere em `revendas`
- `/admin/materiais`: upload (storage `materiais`) + listagem + delete
- `/admin/videos`: tabela com revenda, status, observação inline, botão Baixar (signed URL 1h), Aprovar e Marcar pago

### Build
- `pnpm build` passa sem erros (TS strict)
- 13 rotas registradas, middleware ativo

## ⚠️ Parcial / Notas técnicas

- **Toaster** está no `app/layout.tsx` global (componente shadcn `sonner`)
- **`asChild`** do Radix não existe nessa versão de shadcn (Base UI). Usei `render={<button …/>}` em todos os DialogTrigger
- **Next.js 16** mostra um warning: `"middleware" file convention is deprecated. Please use "proxy" instead.` — funciona normal, dá pra renomear depois
- **Logo PNG**: o briefing pede `/public/logo.png` e `/public/logo-white.png`. Eu deixei placeholders SVG. Quando o usuário subir os PNGs reais, basta trocar o `src` em `src/components/public-header.tsx`, `auth-header.tsx`, `admin-sidebar.tsx`, `public-footer.tsx` e `admin/login/page.tsx`.

## ❌ Pendente — exige ação do usuário

### Deploy na Vercel
Não consegui executar `vercel --prod` autonomamente (login interativo). Para deployar:

```bash
cd "/c/Users/Leonardo Tanus/Desktop/portal-zelo"
pnpm dlx vercel login           # faça login no navegador
pnpm dlx vercel --prod          # link projeto + deploy
```

Quando perguntar:
- Set up and deploy? **Y**
- Which scope? sua conta
- Link to existing project? **N**
- Project name? `portal-zelo` (ou outro)
- Directory? `./`
- Override settings? **N**

### Configurar variáveis de ambiente na Vercel
No painel do projeto (Settings → Environment Variables) ou via CLI, adicione **todas as três** em **Production, Preview e Development**:

```
NEXT_PUBLIC_SUPABASE_URL=https://dddzlklbnfwlxoyudbog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<a chave do .env.local>
SUPABASE_SERVICE_ROLE_KEY=<a chave do .env.local>
```

Via CLI (precisa estar logado e com o projeto linkado):
```bash
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_URL production
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
pnpm dlx vercel env add SUPABASE_SERVICE_ROLE_KEY production
# repetir para "preview" e "development"
```

⚠️ A `SUPABASE_SERVICE_ROLE_KEY` **NÃO** pode começar com `NEXT_PUBLIC_`. Ela só é usada em Server Actions / API Route, nunca no cliente.

### Cadastro do primeiro admin
Para usar `/admin/login`, é preciso ter pelo menos um registro na tabela `admins` apontando para um email que exista no Supabase Auth. No SQL Editor do Supabase:

```sql
-- 1) Crie o usuário no Auth (Authentication → Users → Add user, ou via SDK)
-- 2) Insira na tabela admins:
insert into admins (email, nome) values ('seu.email@zeloprotege.com', 'Admin Zelo');
```

Sem esse passo, qualquer login em `/admin/login` cairá no erro "Esta conta não tem permissão de administrador."

### Buckets do Storage (caso ainda não existam)
A área de admin/materiais usa o bucket público `materiais` (URL pública). A área de upload de vídeos usa o bucket privado `videos-instalacao` (signed URLs no admin). Confirme no painel do Supabase Storage que os dois buckets existem com as policies adequadas:
- `materiais`: público (qualquer um lê), upload restrito a `admins`
- `videos-instalacao`: privado, leitura pelo admin (service role) e por dono pelo `revenda_id` do path; upload pela revenda dona do path.

## 🐛 Bugs / pontos de atenção

- O Google News pode bloquear feeds em ambientes com IP de datacenter. Em produção (Vercel) talvez seja necessário substituir por feeds próprios ou um agregador. O fallback é silencioso — feeds que falham são ignorados.
- `lucide-react` foi instalado na versão 1.x (atual). Todos os ícones usados foram validados.
- `react-hot-toast` foi instalado a pedido do briefing, mas o projeto usa o `sonner` do shadcn (que é o padrão atual). Pode remover `react-hot-toast` se quiser.

## 🔑 Credenciais necessárias na Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Valores no `.env.local` local. **Não** cometa esse arquivo (ele já está no `.gitignore`).

## 📋 Próximos passos para o usuário

1. **Subir PNGs reais** em `public/logo.png` e `public/logo-white.png` (ou trocar para `.svg` no código)
2. **Inserir um admin** via SQL no Supabase (ver acima)
3. **Confirmar buckets do Storage** (`materiais` público, `videos-instalacao` privado) e suas policies
4. **Deploy**: `vercel login` → `vercel --prod`, depois cadastrar as 3 env vars
5. **Testar fim-a-fim**:
   - Login da revenda `jkportoes` / `jkportoes` → `/home`
   - Pedir orçamento → WhatsApp abre com mensagem
   - Subir um vídeo curto → ver na tabela como pendente
   - Login no `/admin/login` com admin cadastrado → ver dashboard, criar revenda, subir material, aprovar vídeo

Bom proveito! 🎉
