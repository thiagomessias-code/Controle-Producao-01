-- 1. Create Product Variations Table (Must be created BEFORE Sales because Sales references it)
create table if not exists public.product_variations (
    id uuid default gen_random_uuid() primary key,
    product_id uuid references public.produtos(id) on delete cascade,
    name text not null,
    price numeric(10,2) not null,
    unit_type text not null, -- 'unidade', 'kg', 'duzia', 'bandeja', 'caixa'
    active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS for Variations
alter table public.product_variations enable row level security;

-- Policies for Variations
create policy "Public read variations" on public.product_variations for select using (true);
create policy "Authenticated insert variations" on public.product_variations for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update variations" on public.product_variations for update using (auth.role() = 'authenticated');
create policy "Authenticated delete variations" on public.product_variations for delete using (auth.role() = 'authenticated');


-- 2. Create Sales Table
create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  galpao_id uuid, -- Maps to groupId, nullable if warehouse sale
  data_venda date default now(), -- Maps to date
  quantidade integer not null,
  preco_unitario numeric(10,2) not null, -- unitPrice
  valor_total numeric(10,2) not null, -- totalPrice
  comprador text, -- buyer
  tipo_produto text, -- productType (legacy or fallback)
  product_variation_id uuid references public.product_variations(id),
  user_id uuid references auth.users(id),
  metodo_pagamento text, -- 'cash', 'check', etc.
  status text default 'completed', -- 'pending', 'completed', 'cancelled'
  observacoes text, -- notes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for Sales
alter table public.sales enable row level security;

-- Policies for Sales
create policy "Public read sales" on public.sales for select using (true);
create policy "Authenticated insert sales" on public.sales for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update sales" on public.sales for update using (auth.role() = 'authenticated');
create policy "Authenticated delete sales" on public.sales for delete using (auth.role() = 'authenticated');

-- Indexes
create index if not exists idx_sales_galpao on public.sales(galpao_id);
create index if not exists idx_sales_date on public.sales(data_venda);
