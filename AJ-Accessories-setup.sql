-- AJ Accessories: Supabase starter database
-- Run this in Supabase Dashboard -> SQL Editor -> New query.
-- IMPORTANT:
-- This creates the database tables and basic access rules only.
-- It does NOT implement Google OAuth or a payment gateway.
-- Do not put Google client secrets, payment secrets, or Supabase service_role keys in HTML.

create extension if not exists pgcrypto;

-- Customer profiles. A customer is created automatically after first sign-in.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('customer','owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products shown in the shop.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  brand text,
  price numeric(12,2) not null default 0 check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders. Payment status must only be changed by trusted server-side code/admin.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  order_number text not null unique default (
    'AJ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  customer_name text not null,
  customer_email text,
  phone text not null,
  city text not null,
  delivery_address text not null,
  payment_method text not null check (
    payment_method in ('Cash on Delivery','Bank Transfer','Safepay')
  ),
  payment_status text not null default 'pending' check (
    payment_status in ('pending','paid','failed','refunded','under_review')
  ),
  order_status text not null default 'pending' check (
    order_status in ('pending','confirmed','processing','shipped','delivered','cancelled')
  ),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  gateway_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Individual products in each order.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

-- Store settings (shipping, contact/payment display details, etc.).
create table if not exists public.store_settings (
  setting_key text primary key,
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Automatically create a customer profile after Supabase Auth creates a user.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- Helper used by policies. The owner role must be assigned manually by a trusted admin.
create or replace function public.is_store_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'owner'
  );
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

-- Profiles: users can view their own profile; owner can view/manage all profiles.
drop policy if exists "profile_select_own_or_owner" on public.profiles;
create policy "profile_select_own_or_owner"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_store_owner());

drop policy if exists "profile_update_own_basic" on public.profiles;
create policy "profile_update_own_basic"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and role = 'customer');

drop policy if exists "owner_manage_profiles" on public.profiles;
create policy "owner_manage_profiles"
on public.profiles for all to authenticated
using (public.is_store_owner())
with check (public.is_store_owner());

-- Products: everyone can read active products; only owner can manage products.
drop policy if exists "public_read_active_products" on public.products;
create policy "public_read_active_products"
on public.products for select to anon, authenticated
using (is_active = true or public.is_store_owner());

drop policy if exists "owner_manage_products" on public.products;
create policy "owner_manage_products"
on public.products for all to authenticated
using (public.is_store_owner())
with check (public.is_store_owner());

-- Orders: customers can read their own orders. Owner can manage all orders.
drop policy if exists "customer_read_own_orders" on public.orders;
create policy "customer_read_own_orders"
on public.orders for select to authenticated
using (user_id = (select auth.uid()) or public.is_store_owner());

drop policy if exists "customer_create_own_order" on public.orders;
create policy "customer_create_own_order"
on public.orders for insert to authenticated
with check (
  user_id = (select auth.uid())
  and payment_status = 'pending'
  and order_status = 'pending'
);

drop policy if exists "owner_manage_orders" on public.orders;
create policy "owner_manage_orders"
on public.orders for all to authenticated
using (public.is_store_owner())
with check (public.is_store_owner());

-- Order items: customers can read items belonging to their own orders.
drop policy if exists "customer_read_own_order_items" on public.order_items;
create policy "customer_read_own_order_items"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid()) or public.is_store_owner())
  )
);

drop policy if exists "customer_add_items_to_own_pending_order" on public.order_items;
create policy "customer_add_items_to_own_pending_order"
on public.order_items for insert to authenticated
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.user_id = (select auth.uid())
      and o.payment_status = 'pending'
      and o.order_status = 'pending'
  )
);

drop policy if exists "owner_manage_order_items" on public.order_items;
create policy "owner_manage_order_items"
on public.order_items for all to authenticated
using (public.is_store_owner())
with check (public.is_store_owner());

-- Settings: public can read settings; only owner can change them.
drop policy if exists "public_read_store_settings" on public.store_settings;
create policy "public_read_store_settings"
on public.store_settings for select to anon, authenticated
using (true);

drop policy if exists "owner_manage_store_settings" on public.store_settings;
create policy "owner_manage_store_settings"
on public.store_settings for all to authenticated
using (public.is_store_owner())
with check (public.is_store_owner());

-- Add starter settings if they do not already exist.
insert into public.store_settings (setting_key, setting_value)
values
  ('currency', '{"code":"PKR","symbol":"Rs."}'::jsonb),
  ('delivery_fee', '{"amount":250}'::jsonb),
  ('free_shipping_threshold', '{"amount":5000}'::jsonb)
on conflict (setting_key) do nothing;

-- IMPORTANT NEXT STEPS:
-- 1) After your own Google sign-in has created a profile, promote ONLY your own
--    profile to owner by running a carefully checked command in the SQL Editor:
--    update public.profiles set role = 'owner'
--    where email = 'YOUR-ADMIN-EMAIL';
-- 2) Do not run that command for a customer.
-- 3) The website HTML supplied in the conversation is incomplete and has no
--    Supabase client/database/payment JavaScript. This schema will not make
--    that incomplete file work by itself.
-- 4) For real online payments, create a server-side Edge Function that calculates
--    totals from products in the database, creates the gateway session, and
--    verifies the signed payment webhook before marking an order paid.
--    Never accept a browser redirect alone as proof of payment.
