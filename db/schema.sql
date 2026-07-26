-- Схема для Timeweb Managed PostgreSQL.
-- Выполнить один раз: psql "$DATABASE_URL" -f db/schema.sql

create extension if not exists pgcrypto;

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

-- Отдельные учётные записи админки (раньше — Supabase Auth). Пароль хранится
-- только как bcrypt-хэш, см. lib/session.ts / app/api/auth/login/route.ts.
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);
