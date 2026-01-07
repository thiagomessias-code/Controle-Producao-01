-- Tabela para armazenar as inscrições de push notifications dos navegadores
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(endpoint) -- Evita duplicatas para o mesmo navegador
);

-- Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Usuários podem ver suas próprias inscrições"
    ON public.push_subscriptions FOR SELECT
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas próprias inscrições"
    ON public.push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar suas próprias inscrições"
    ON public.push_subscriptions FOR DELETE
    USING (auth.uid() = usuario_id);
