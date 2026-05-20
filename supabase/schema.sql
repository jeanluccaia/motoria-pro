-- ================================================================
-- MotorIA Pro — Schema completo
-- Execute inteiro no Supabase SQL Editor (uma única query)
-- ================================================================

-- ----------------------------------------------------------------
-- EXTENSÕES
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- TABELAS
-- ================================================================

-- ----------------------------------------------------------------
-- 1. profiles — espelho de auth.users, armazena status de pagamento
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT,
  avatar_url    TEXT,
  is_paid       BOOLEAN     NOT NULL DEFAULT FALSE,
  paid_at       TIMESTAMPTZ,
  payment_id    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 2. access_codes - codigos de acesso do MVP
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_codes (
  code        TEXT        PRIMARY KEY,
  max_uses    INTEGER     NOT NULL DEFAULT 20 CHECK (max_uses > 0),
  used_count  INTEGER     NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

INSERT INTO public.access_codes (code, max_uses, used_count, active)
VALUES
  ('JEAN2026', 20, 0, TRUE),
  ('GELEIA2026', 20, 0, TRUE),
  ('TESTE2026', 20, 0, TRUE)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------
-- 3. access_grants - emails liberados por compra/codigo/admin
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_grants (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL,
  user_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  code          TEXT        REFERENCES public.access_codes(code),
  source        TEXT        NOT NULL DEFAULT 'code',
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS access_grants_email_code_uidx
  ON public.access_grants (email, code);

-- ----------------------------------------------------------------
-- 2. bankroll — banca financeira do usuário
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bankroll (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency        TEXT        NOT NULL DEFAULT 'BRL',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ----------------------------------------------------------------
-- 3. bets — apostas simples (entrada única)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game            TEXT,
  market          TEXT,
  odd             NUMERIC(8,2)  NOT NULL,
  stake           NUMERIC(12,2) NOT NULL,
  resultado       TEXT        CHECK (resultado IN ('ganhou', 'perdeu', 'pendente')) DEFAULT 'pendente',
  profit_loss     NUMERIC(12,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 4. bet_slips — bilhetes múltiplos (cabeçalho)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bet_slips (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stake           NUMERIC(12,2),
  total_odd       NUMERIC(10,2),
  real_chance     NUMERIC(6,2),
  risk_level      TEXT        CHECK (risk_level IN ('baixo', 'médio', 'alto', 'muito alto')),
  resultado       TEXT        CHECK (resultado IN ('ganhou', 'perdeu', 'pendente')) DEFAULT 'pendente',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 5. bet_slip_selections — seleções de cada bilhete múltiplo
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bet_slip_selections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_id     UUID        NOT NULL REFERENCES public.bet_slips(id) ON DELETE CASCADE,
  game        TEXT,
  market      TEXT,
  odd         NUMERIC(8,2),
  acertou     BOOLEAN,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 6. analyses — histórico de análises da IA (Analisar.jsx)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analyses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- dados da entrada
  game            TEXT,
  market          TEXT,
  odd             NUMERIC(8,2),
  stake           NUMERIC(12,2),
  -- resultado da análise matemática
  kelly_fraction  NUMERIC(8,4),
  ev_percent      NUMERIC(8,2),
  risk_score      INTEGER,
  recommendation  TEXT,
  -- resposta completa da IA (JSON)
  ai_response     JSONB,
  -- acesso
  is_paid_at_time BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TRIGGER — cria profile + bankroll ao cadastrar via auth
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cria profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Cria bankroll zerado
  INSERT INTO public.bankroll (user_id, initial_balance, current_balance)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- TRIGGER — atualiza updated_at automaticamente
-- ================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_access_grants_updated_at
  BEFORE UPDATE ON public.access_grants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_bankroll_updated_at
  BEFORE UPDATE ON public.bankroll
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bankroll            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_slips           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_slip_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses            ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------
CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ----------------------------------------------------------------
-- access_codes
-- ----------------------------------------------------------------
CREATE POLICY "access_codes: no public access"
  ON public.access_codes FOR SELECT
  USING (FALSE);

-- ----------------------------------------------------------------
-- access_grants
-- ----------------------------------------------------------------
CREATE POLICY "access_grants: select own"
  ON public.access_grants FOR SELECT
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- bankroll
-- ----------------------------------------------------------------
CREATE POLICY "bankroll: select own"
  ON public.bankroll FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bankroll: insert own"
  ON public.bankroll FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bankroll: update own"
  ON public.bankroll FOR UPDATE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- bets
-- ----------------------------------------------------------------
CREATE POLICY "bets: select own"
  ON public.bets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bets: insert own"
  ON public.bets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bets: update own"
  ON public.bets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "bets: delete own"
  ON public.bets FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- bet_slips
-- ----------------------------------------------------------------
CREATE POLICY "bet_slips: select own"
  ON public.bet_slips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bet_slips: insert own"
  ON public.bet_slips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bet_slips: update own"
  ON public.bet_slips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "bet_slips: delete own"
  ON public.bet_slips FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- bet_slip_selections (acesso via slip do próprio usuário)
-- ----------------------------------------------------------------
CREATE POLICY "slip_selections: select own"
  ON public.bet_slip_selections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bet_slips s
      WHERE s.id = slip_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "slip_selections: insert own"
  ON public.bet_slip_selections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bet_slips s
      WHERE s.id = slip_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "slip_selections: delete own"
  ON public.bet_slip_selections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bet_slips s
      WHERE s.id = slip_id AND s.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- analyses
-- ----------------------------------------------------------------
CREATE POLICY "analyses: select own"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "analyses: insert own"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses: delete own"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- FIM DO SCHEMA
-- ================================================================
