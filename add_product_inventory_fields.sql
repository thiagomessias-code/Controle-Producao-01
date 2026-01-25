-- Migration: Add inventory control and technical sheet to products
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS controla_estoque BOOLEAN DEFAULT TRUE;

ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS ficha_tecnica JSONB DEFAULT NULL;

COMMENT ON COLUMN public.produtos.controla_estoque IS 'Define se o produto possui estoque físico real ou se é um derivado.';
COMMENT ON COLUMN public.produtos.ficha_tecnica IS 'Lista de insumos necessários para produtos derivados: [{ "raw_material_name": "...", "stock_type": "egg|meat|chick", "quantity": 0 }]';
