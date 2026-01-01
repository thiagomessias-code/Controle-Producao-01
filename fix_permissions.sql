-- Relax Policies for Product Variations
drop policy if exists "Authenticated insert variations" on public.product_variations;
drop policy if exists "Authenticated update variations" on public.product_variations;
drop policy if exists "Authenticated delete variations" on public.product_variations;

create policy "Public insert variations" on public.product_variations for insert with check (true);
create policy "Public update variations" on public.product_variations for update using (true);
create policy "Public delete variations" on public.product_variations for delete using (true);

-- Relax Policies for Sales
drop policy if exists "Authenticated insert sales" on public.sales;
drop policy if exists "Authenticated update sales" on public.sales;
drop policy if exists "Authenticated delete sales" on public.sales;

create policy "Public insert sales" on public.sales for insert with check (true);
create policy "Public update sales" on public.sales for update using (true);
create policy "Public delete sales" on public.sales for delete using (true);
