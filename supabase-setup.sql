-- شغّل الملف ده مرة واحدة من Supabase > SQL Editor > New query > Run

create table if not exists public.store_data (
  id int primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- أمان: مفيش أي صلاحية للعامة. السيرفر بس (service key) هو اللي بيقرأ ويكتب.
alter table public.store_data enable row level security;

-- مكان صور المنتجات (عام للقراءة فقط)
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;
