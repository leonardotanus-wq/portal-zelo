-- =====================================================================
-- 0002_tracking.sql — Sistema de engajamento das revendas
-- =====================================================================
-- Rodar manualmente no SQL Editor do Supabase. Não executado pelo app.
-- =====================================================================

-- ----------------------------------------------------------------------
-- 1. Tabela de eventos
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('login', 'page_view', 'click_botao', 'logout', 'upload_video')),
  detalhe TEXT,
  user_agent TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_revenda_id ON eventos_revenda(revenda_id);
CREATE INDEX IF NOT EXISTS idx_eventos_created_at ON eventos_revenda(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos_revenda(tipo);

-- ----------------------------------------------------------------------
-- 2. Colunas extras em revendas
-- ----------------------------------------------------------------------
ALTER TABLE revendas
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ultimo_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_logins INTEGER DEFAULT 0;

-- ----------------------------------------------------------------------
-- 3. RLS — eventos_revenda
-- ----------------------------------------------------------------------
ALTER TABLE eventos_revenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_total_eventos" ON eventos_revenda;
CREATE POLICY "admin_total_eventos" ON eventos_revenda
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "revenda_cria_eventos" ON eventos_revenda;
CREATE POLICY "revenda_cria_eventos" ON eventos_revenda
  FOR INSERT WITH CHECK (
    revenda_id IN (SELECT id FROM revendas WHERE user_id = auth.uid())
  );

-- ----------------------------------------------------------------------
-- 4. Função para incrementar total_logins
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION incrementar_total_logins(revenda_id_param UUID)
RETURNS void AS $$
  UPDATE revendas
  SET total_logins = COALESCE(total_logins, 0) + 1,
      ultimo_login_at = now(),
      last_seen_at = now()
  WHERE id = revenda_id_param;
$$ LANGUAGE SQL;

-- ----------------------------------------------------------------------
-- 5. Função top_revendas_semana — usada pelo cron de relatório semanal
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION top_revendas_semana()
RETURNS TABLE(nome_empresa TEXT, total BIGINT) AS $$
  SELECT r.nome_empresa, COUNT(e.id) AS total
  FROM revendas r
  LEFT JOIN eventos_revenda e ON e.revenda_id = r.id
    AND e.tipo = 'login'
    AND e.created_at >= NOW() - INTERVAL '7 days'
  WHERE r.ativa = true
  GROUP BY r.id, r.nome_empresa
  ORDER BY total DESC
  LIMIT 5;
$$ LANGUAGE SQL;
