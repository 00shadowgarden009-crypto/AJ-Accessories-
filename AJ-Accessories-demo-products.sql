-- AJ Accessories demo catalog: 500 realistic but clearly fictional accessory listings.
-- Run in Supabase SQL Editor after the products table exists.
-- Re-running replaces only AJ Demo Catalog rows, preserving your real products.

begin;

delete from public.products where brand = 'AJ Demo Catalog';

with seed as (
  select n,
    case (n - 1) % 8
      when 0 then 'Wireless Earbuds'
      when 1 then 'Headphones'
      when 2 then 'Speakers'
      when 3 then 'Mobile Covers'
      when 4 then 'Fast Chargers'
      when 5 then 'Power Banks'
      when 6 then 'Smart Watches'
      else 'Screen Protectors'
    end as category
  from generate_series(1, 500) s(n)
), catalog as (
  select n, category,
    case category
      when 'Wireless Earbuds' then 1499 + ((n * 137) % 7502)
      when 'Headphones' then 2499 + ((n * 173) % 14502)
      when 'Speakers' then 1999 + ((n * 211) % 18002)
      when 'Mobile Covers' then 699 + ((n * 89) % 3302)
      when 'Fast Chargers' then 999 + ((n * 97) % 7202)
      when 'Power Banks' then 1799 + ((n * 127) % 10202)
      when 'Smart Watches' then 2999 + ((n * 193) % 22002)
      else 399 + ((n * 53) % 2102)
    end::numeric(12,2) as price,
    case category
      when 'Wireless Earbuds' then 'AJ AirBeat '
      when 'Headphones' then 'AJ StudioPulse '
      when 'Speakers' then 'AJ BassArc '
      when 'Mobile Covers' then 'AJ FlexArmor '
      when 'Fast Chargers' then 'AJ VoltForge '
      when 'Power Banks' then 'AJ ChargeCore '
      when 'Smart Watches' then 'AJ WristNova '
      else 'AJ ClearShield '
    end || lpad(n::text, 3, '0') as name,
    case category
      when 'Wireless Earbuds' then 'Bluetooth 5.3 wireless earbuds with touch controls, clear-call microphones and a pocket charging case.'
      when 'Headphones' then 'Comfort-fit headphones with balanced sound, soft cushions, foldable construction and wireless playback.'
      when 'Speakers' then 'Portable wireless speaker with deep bass, convenient controls and a rechargeable battery.'
      when 'Mobile Covers' then 'Slim protective cover with raised camera edges, a secure grip and precise access to ports.'
      when 'Fast Chargers' then 'Compact USB-C fast charger with intelligent power delivery and built-in temperature protection.'
      when 'Power Banks' then 'Portable power bank with USB-C fast charging, multi-device outputs and power-level indication.'
      when 'Smart Watches' then 'Touch-screen smartwatch with activity tracking, call and app notifications and an adjustable strap.'
      else 'Tempered-glass screen protector with smooth touch response, high transparency and edge-to-edge coverage.'
    end as description,
    case category
      when 'Wireless Earbuds' then 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=85'
      when 'Headphones' then 'https://images.unsplash.com/photo-1502856757208-5b13af1c3e8a?auto=format&fit=crop&w=800&q=85'
      when 'Speakers' then 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=85'
      when 'Mobile Covers' then 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=85'
      when 'Fast Chargers' then 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=85'
      when 'Power Banks' then 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=85'
      when 'Smart Watches' then 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=85'
      else 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=85'
    end as image_url
  from seed
)
insert into public.products (
  name, description, category, brand, price, compare_at_price,
  image_url, stock, is_active, is_featured
)
select
  name,
  description || ' Fictional demo model ' || lpad(n::text, 3, '0') || '.',
  category,
  'AJ Demo Catalog',
  price,
  round(price * (1.12 + ((n % 5) * 0.04)))::numeric(12,2),
  image_url,
  5 + ((n * 11) % 96),
  true,
  n <= 16
from catalog;

do $$
declare
  demo_count integer;
begin
  select count(*) into demo_count
  from public.products
  where brand = 'AJ Demo Catalog';

  if demo_count <> 500 then
    raise exception 'Expected 500 demo products, found %', demo_count;
  end if;
end;
$$;

commit;

select brand, category, count(*) as products, min(price) as lowest_pkr, max(price) as highest_pkr
from public.products
where brand = 'AJ Demo Catalog'
group by brand, category
order by category;
