-- 0001: tabela revendas (retroativo — schema veio do Supabase Dashboard)
--
-- Esta migration reconstrói o estado atual da tabela revendas em prod
-- pra garantir reprodutibilidade. Inclui as colunas posteriormente
-- adicionadas pelas migrations 0002 (tracking) e 0003 (jornada),
-- de forma que aplicar 0001+0002+0003 em ordem num banco vazio
-- resulta no mesmo schema que prod.
--
-- ATENÇÃO: este arquivo NUNCA deve ser aplicado em prod (a tabela já
-- existe lá). É só pra que devs novos consigam reproduzir o schema
-- localmente em ambiente Supabase vazio.

BEGIN;

CREATE TABLE IF NOT EXISTS revendas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa      TEXT NOT NULL UNIQUE,
  nome_responsavel  TEXT,
  cidade            TEXT,
  estado            TEXT,
  vendedor_nome     TEXT,
  vendedor_whatsapp TEXT,
  ativa             BOOLEAN NOT NULL DEFAULT TRUE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Constraint do slug (login da revenda) — mesmo regex que o Bot valida.
ALTER TABLE revendas
  ADD CONSTRAINT IF NOT EXISTS revendas_nome_empresa_format
  CHECK (nome_empresa ~ '^[a-z0-9]{2,40}$');

COMMIT;
