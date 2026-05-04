# STATUS — Zelo Portal

## 🆕 Mudanças desta rodada (2026-05-04 — Jornada da Revenda)

### Banco de dados
- **Migration SQL** em `supabase/migrations/0003_jornada.sql` (NÃO executada — rodar manualmente no SQL Editor):
  - Adiciona coluna `etapa_jornada INTEGER DEFAULT 3 CHECK (1..6)` em `revendas`.
  - Backfill: revendas existentes ficam na etapa 3 (já têm acesso ao portal).

### Constantes e tipos
- `src/lib/jornada.ts` — `ETAPAS_JORNADA` (6 etapas: Contato → Ficha Cadastral → Acesso ao Portal → Treinamento Comercial → Primeira Venda → Curso Técnico Zelo), `TOTAL_ETAPAS`, `etapaValida()`.
- `src/lib/types.ts` — `Revenda.etapa_jornada: number` adicionado.

### Componente JornadaRevenda
- `src/components/jornada-revenda.tsx` (Server Component), prop `etapaAtual`:
  - **Desktop (`sm:`):** stepper horizontal com 6 círculos numerados, linhas conectoras amarelas até a etapa atual e cinza depois. Etapa atual com `animate-pulse`. Etapas concluídas com check (`lucide`). Cada círculo + label tem `title` HTML para tooltip nativo.
  - **Mobile:** linha resumida "Sua jornada: etapa X de 6 — Nome", barra de progresso fina (`h-2 rounded-full`) e "Próxima etapa: …" abaixo.
  - **Estado especial:** `etapaAtual === 6` mostra fundo `bg-green-50` com 🎉 e "Parabéns! Jornada Zelo concluída".

### Home da revenda
- `src/app/(auth)/home/page.tsx` agora é async, busca `getRevendaLogada()` e renderiza `<JornadaRevenda etapaAtual={...} />` acima do banner amarelo de upload de vídeo.

### Admin de revendas
- `src/app/admin/(panel)/revendas/revendas-client.tsx`:
  - Nova coluna **"Etapa"** na tabela com badge cinza no formato `N/6 — Nome`.
  - Componente local `<SelectEtapa>` (native `<select>` estilizado, sem dependência nova) reutilizado nos diálogos de **Criar** e **Editar** revenda.
  - Ambos os formulários incluem o estado `etapa_jornada` (default 3).
- `src/app/admin/(panel)/revendas/actions.ts` — `atualizarRevenda()` agora aceita e valida `etapa_jornada` (1..6); chama `revalidatePath("/home")` para refletir o banner na próxima carga.
- `src/app/api/admin/criar-revenda/route.ts` — aceita `etapa_jornada` no payload, valida 1..6 e persiste no INSERT.

### Validação
- `pnpm build` passa sem erros (14 rotas dinâmicas).

### Ações pendentes para o usuário (esta rodada)
1. **Rodar a migration**: copiar `supabase/migrations/0003_jornada.sql` no SQL Editor do Supabase e executar.
2. No `/admin/revendas`, editar a `jkportoes` e mudar a etapa pra 4 ou 5 pra testar.
3. Logar como `jkportoes` e verificar o banner no `/home`.
4. Testar mobile (DevTools mobile view) para validar a versão compacta com a barra de progresso.

---

## 🆕 Mudanças anteriores (2026-05-03 — engajamento + tracking)

### Sistema de tracking de revendas
- **Migration SQL** em `supabase/migrations/0002_tracking.sql` (NÃO executada — rodar manualmente no SQL Editor):
  - Tabela `eventos_revenda` (login, page_view, click_botao, logout, upload_video) com índices em `revenda_id`, `created_at` e `tipo`
  - Colunas extras em `revendas`: `last_seen_at`, `ultimo_login_at`, `total_logins`
  - RLS: admin lê tudo (`is_admin()`), revenda só insere os próprios eventos
  - Função `incrementar_total_logins(revenda_id_param)`
  - Função `top_revendas_semana()` usada pelo cron
- **Helper** `src/lib/tracking.ts` — `trackEvento(revenda, tipo, detalhe?)` registra o evento e atualiza `last_seen_at` (ou `total_logins` em login). Tudo encapsulado em try/catch — nunca bloqueia o fluxo principal.
- Pontos rastreados:
  - **Login**: `src/app/(public)/actions.ts` — após `signInWithPassword` ok, busca a revenda e chama `trackEvento(revenda, "login")`
  - **Logout**: `src/app/(auth)/actions.ts` — registra antes de `signOut()`
  - **Page view**: `src/app/(auth)/layout.tsx` — usa header `x-pathname` (setado no middleware) com fallback em `referer`
  - **Upload de vídeo**: `src/app/(auth)/upload-video/actions.ts` — após o INSERT, antes do email
  - **Cliques nos 6 botões da home**: novo `src/components/home-cards.tsx` (Client Component) chama `POST /api/track-click` via `navigator.sendBeacon` (com fallback para `fetch({ keepalive: true })`) e DEPOIS abre o link

### Endpoint de click tracking
- `src/app/api/track-click/route.ts` (POST) — exige sessão autenticada, valida `detalhe` e chama `trackEvento(revenda, "click_botao", slug)`. Slug limitado a 80 chars.

### Middleware (`src/lib/supabase/middleware.ts`)
- Agora seta `x-pathname` nos headers da request para uso na page_view.
- `PUBLIC_PREFIXES` adicionado: `/api/cron/` é considerada rota pública (não exige sessão; protegida por `CRON_SECRET`).

### Painel admin de Engajamento
- Nova rota `/admin/engajamento` (`src/app/admin/(panel)/engajamento/page.tsx`):
  - 4 KPIs: logins hoje, logins na semana, revendas ativas (7d), revendas sumidas (14d+ — destaque vermelho)
  - **Ranking do mês** (top 10 por logins, com cliques + último login relativo via `date-fns/formatDistanceToNow`)
  - **Quem logou** — Tabs (hoje / esta semana) com lista nominal e tempo relativo
  - **Revendas sumidas** (14+ dias ou nunca logaram) — botão amarelo "Avisar vendedor" abre `wa.me/{vendedor_whatsapp}` com mensagem pronta ("…não acessa o portal Zelo há X dias…")
  - **Cliques por botão** — barras CSS nativas (sem nova dependência), agregadas dos 6 slugs (orcamento, pecas, videos_bombando, modelos_proposta, manuais, videos_diversas)
- Sidebar admin (`src/components/admin-sidebar.tsx`) com novo link "Engajamento" (ícone `Activity`).

### Email semanal automático (Vercel Cron)
- `vercel.json` — cron `0 12 * * 1` (segunda 9h BRT / 12h UTC) → `/api/cron/relatorio-semanal`.
- `src/app/api/cron/relatorio-semanal/route.ts` (GET):
  - Exige `Authorization: Bearer ${CRON_SECRET}` (Vercel envia automaticamente)
  - Usa `createAdminClient()` (service role) para agregar 7d: logins, cliques, revendas ativas, sumidas (14d+) e top 5 (`top_revendas_semana()`)
  - Email HTML responsivo com link CTA amarelo para `/admin/engajamento`
  - Em ambiente sem `RESEND_API_KEY` real, retorna `{ ok: true, enviado: false, motivo: "config", stats: {...} }` (não falha)
- Variáveis novas em `.env.local`:
  - `CRON_SECRET=mude-isso-pra-uma-string-aleatoria-grande_PLACEHOLDER`
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

### Validação
- `pnpm build` passa sem erros (14 rotas dinâmicas, incluindo `/admin/engajamento`, `/api/track-click` e `/api/cron/relatorio-semanal`).

### Ações pendentes para o usuário (esta rodada)
1. **Rodar a migration**: copiar o conteúdo de `supabase/migrations/0002_tracking.sql` no SQL Editor do Supabase e executar.
2. **Trocar `CRON_SECRET`** no `.env.local` por uma string aleatória forte (`openssl rand -base64 32`).
3. Em produção (Vercel) replicar `CRON_SECRET` e `NEXT_PUBLIC_SITE_URL` (com a URL real do deploy) em Production/Preview/Development.
4. Pra testar a página `/admin/engajamento` localmente sem dados: faça alguns logins/cliques pra popular `eventos_revenda`.

---

## 🗂️ Mudanças anteriores (2026-05-03)

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
