-- =====================================================================
-- 0003_jornada.sql — Jornada de onboarding da revenda
-- =====================================================================
-- Rodar manualmente no SQL Editor do Supabase. Não executado pelo app.
-- =====================================================================

ALTER TABLE revendas
  ADD COLUMN IF NOT EXISTS etapa_jornada INTEGER DEFAULT 3
  CHECK (etapa_jornada >= 1 AND etapa_jornada <= 6);

-- Toda revenda existente é considerada na etapa 3 (acesso ao portal liberado)
UPDATE revendas SET etapa_jornada = 3 WHERE etapa_jornada IS NULL;
