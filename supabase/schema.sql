-- Схема для админ-панели NutriHome.
-- Выполнить один раз в Supabase → SQL Editor (весь файл целиком).

create table if not exists products (
  id text primary key,
  slug text unique not null,
  name text not null,
  brand text not null,
  price numeric not null,
  old_price numeric,
  age_group text not null check (age_group in ('adult', 'kids')),
  purposes text[] not null default '{}',
  active_components text[] not null default '{}',
  form text not null check (form in ('capsules', 'tablets', 'powder', 'liquid', 'gummies')),
  volume text not null,
  description text not null default '',
  rating numeric not null default 0,
  reviews_count integer not null default 0,
  in_stock boolean not null default true,
  stock_quantity integer not null default 0,
  is_hit boolean not null default false,
  accent text not null default 'brand',
  image_url text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purposes (
  slug text primary key,
  label text not null
);

create table if not exists brands (
  slug text primary key,
  label text not null
);

create table if not exists active_components (
  slug text primary key,
  label text not null
);

create table if not exists site_settings (
  id integer primary key default 1,
  name text not null,
  tagline text not null,
  hero_title text not null,
  hero_subtitle text not null,
  phone text not null,
  phone_href text not null,
  whatsapp_number text not null,
  telegram_username text not null,
  max_href text not null,
  email text not null,
  address text not null,
  working_hours text not null,
  vk_url text not null default '',
  pickup_info text not null default '',
  constraint site_settings_single_row check (id = 1)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_phone text not null,
  fulfillment text,
  customer_comment text,
  items jsonb not null,
  total_price numeric not null,
  status text not null default 'new' check (status in ('new', 'processing', 'done', 'cancelled'))
);

-- Row Level Security: анонимный ключ (лежит в клиентском JS) может только
-- читать каталог/настройки и создавать заказы. Изменять что-либо может
-- только залогиненный через Supabase Auth пользователь (админка).

alter table products enable row level security;
alter table purposes enable row level security;
alter table brands enable row level security;
alter table active_components enable row level security;
alter table site_settings enable row level security;
alter table orders enable row level security;

create policy "products_select_public" on products for select using (true);
create policy "products_write_admin" on products for all to authenticated using (true) with check (true);

create policy "purposes_select_public" on purposes for select using (true);
create policy "purposes_write_admin" on purposes for all to authenticated using (true) with check (true);

create policy "brands_select_public" on brands for select using (true);
create policy "brands_write_admin" on brands for all to authenticated using (true) with check (true);

create policy "active_components_select_public" on active_components for select using (true);
create policy "active_components_write_admin" on active_components for all to authenticated using (true) with check (true);

create policy "site_settings_select_public" on site_settings for select using (true);
create policy "site_settings_write_admin" on site_settings for all to authenticated using (true) with check (true);

create policy "orders_insert_public" on orders for insert to anon, authenticated with check (true);
create policy "orders_select_admin" on orders for select to authenticated using (true);
create policy "orders_update_admin" on orders for update to authenticated using (true) with check (true);

-- Хранилище для фото товаров: бакет публичный на чтение (фото доступны по
-- прямой ссылке всем), загружать/менять/удалять может только залогиненный
-- в админку пользователь.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_select_public" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_insert_admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

create policy "product_images_update_admin" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

create policy "product_images_delete_admin" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
