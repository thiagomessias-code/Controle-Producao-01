-- Create Product Variations Table
create table if not exists public.product_variations (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.produtos(id) on delete cascade not null,
  name text not null, -- e.g. "Bandeja 30", "1 Kg"
  price numeric(10,2) not null,
  unit_type text, -- 'unidade', 'kg', 'cx', etc.
  active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.product_variations enable row level security;
create policy "Public read variations" on public.product_variations for select using (true);
create policy "Admin all variations" on public.product_variations for all using (auth.role() = 'authenticated'); -- Adjust as needed

-- Update Sales Table
alter table public.sales add column if not exists product_variation_id uuid references public.product_variations(id);
alter table public.sales add column if not exists user_id uuid references auth.users(id);

comment on column public.sales.user_id is 'User who registered the sale (Auding)';
