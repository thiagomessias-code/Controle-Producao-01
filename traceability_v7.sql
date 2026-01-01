-- Rastreabilidade Total v7.0
-- Este script adiciona o suporte para rastreamento por sexo e histórico de transferências granulares.

-- 1. Atualizar a tabela de lotes para conter quantidades por sexo
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS males INTEGER DEFAULT 0;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS females INTEGER DEFAULT 0;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.lotes(id); -- Para rastrear árvore genealógica de transferências

-- 2. Criar a tabela de transferências detalhadas
CREATE TABLE IF NOT EXISTS public.bird_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_batch_id UUID REFERENCES public.lotes(id) ON DELETE SET NULL,
    dest_batch_id UUID REFERENCES public.lotes(id) ON DELETE CASCADE,
    origin_cage_id UUID REFERENCES public.gaiolas(id) ON DELETE SET NULL,
    dest_cage_id UUID REFERENCES public.gaiolas(id) ON DELETE SET NULL,
    males_count INTEGER DEFAULT 0,
    females_count INTEGER DEFAULT 0,
    transfer_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.bird_transfers ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Acesso
CREATE POLICY "Public read bird_transfers" ON public.bird_transfers FOR SELECT USING (true);
CREATE POLICY "Authenticated insert bird_transfers" ON public.bird_transfers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Comentários
COMMENT ON TABLE public.bird_transfers IS 'Histórico detalhado de transferências e sexagem para rastreabilidade v7.0';
