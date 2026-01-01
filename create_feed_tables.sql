-- Feed Types (Rações)
create table if not exists public.feed_types (
    id uuid default gen_random_uuid() primary key,
    name text not null, -- e.g., "Ração Inicial Premium"
    phase text not null, -- e.g., "inicial", "crescimento", "postura"
    price_per_kg numeric(10,2) default 0,
    supplier_default text,
    active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Feed Schedules (Horários)
create table if not exists public.feed_schedules (
    id uuid default gen_random_uuid() primary key,
    phase text not null, -- e.g., "inicial", "crescimento", "postura"
    time text not null, -- e.g., "07:00", "13:00"
    active boolean default true,
    created_at timestamptz default now()
);

-- Feed Consumption (Consumo)
create table if not exists public.feed_consumption (
    id uuid default gen_random_uuid() primary key,
    galpao_id uuid, -- Maps to groupId
    gaiola_id uuid, -- Maps to cageId
    lote_id uuid, -- Maps to batchId
    data_consumo date default now(),
    quantidade_kg numeric(10,3) not null,
    feed_type_id uuid references public.feed_types(id),
    feed_type_name text, -- Fallback/Snapshot of name
    user_id uuid references auth.users(id),
    observacoes text,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.feed_types enable row level security;
alter table public.feed_schedules enable row level security;
alter table public.feed_consumption enable row level security;

-- Create Permissive Policies (Public Access for transparency/ease of use per user context)
create policy "Enable all access for feed_types" on public.feed_types for all using (true) with check (true);
create policy "Enable all access for feed_schedules" on public.feed_schedules for all using (true) with check (true);
create policy "Enable all access for feed_consumption" on public.feed_consumption for all using (true) with check (true);
