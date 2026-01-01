-- Enable RLS on tables (just in case)
alter table public.product_variations enable row level security;
alter table public.sales enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Public insert variations" on public.product_variations;
drop policy if exists "Public update variations" on public.product_variations;
drop policy if exists "Public delete variations" on public.product_variations;
drop policy if exists "Public read variations" on public.product_variations;
drop policy if exists "Authenticated insert variations" on public.product_variations;
drop policy if exists "Authenticated update variations" on public.product_variations;
drop policy if exists "Authenticated delete variations" on public.product_variations;

drop policy if exists "Public insert sales" on public.sales;
drop policy if exists "Public update sales" on public.sales;
drop policy if exists "Public delete sales" on public.sales;
drop policy if exists "Public read sales" on public.sales;
drop policy if exists "Authenticated insert sales" on public.sales;
drop policy if exists "Authenticated update sales" on public.sales;
drop policy if exists "Authenticated delete sales" on public.sales;

-- Create Permissive Policies for Product Variations (Public Access)
create policy "Enable all access for variations"
on public.product_variations
for all
using (true)
with check (true);

-- Create Permissive Policies for Sales (Public Access)
create policy "Enable all access for sales"
on public.sales
for all
using (true)
with check (true);
