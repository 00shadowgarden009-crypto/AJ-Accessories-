-- AJ Accessories demo catalog: 500 realistic but clearly fictional accessory listings.
-- Run in Supabase SQL Editor after the products table exists.
-- Re-running replaces only AJ Demo Catalog rows, preserving your real products.
-- Image URLs are category-specific and vary between listings.

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
      when 'Wireless Earbuds' then array[
        'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46',
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
        'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb',
        'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7'
      ][(n % 4) + 1]
      when 'Headphones' then array[
        'https://images.unsplash.com/photo-1502856757208-5b13af1c3e8a',
        'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb',
        'https://images.unsplash.com/photo-1487215078519-e21cc028cb29',
        'https://images.unsplash.com/photo-1545127398-14699f92334b'
      ][(n % 4) + 1]
      when 'Speakers' then array[
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1',
        'https://images.unsplash.com/photo-1589003077984-894e133dabab',
        'https://images.unsplash.com/photo-1584679133445-8ca7b7c6e7d9',
        'https://images.unsplash.com/photo-1585298723682-7115561c51b7'
      ][(n % 4) + 1]
      when 'Mobile Covers' then array[
        'https://images.unsplash.com/photo-1601593346740-925612772716',
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c'
      ][(n % 4) + 1]
      when 'Fast Chargers' then array[
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0',
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5',
        'https://images.unsplash.com/photo-1615529162924-f8605388461d',
        'https://images.unsplash.com/photo-1591206114872-ae56a1a2c8e7'
      ][(n % 4) + 1]
      when 'Power Banks' then array[
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5',
        'https://images.unsplash.com/photo-1609592424829-7ed3b9f72f5e',
        'https://images.unsplash.com/photo-1587036813737-0ca2f9b4e0d1',
        'https://images.unsplash.com/photo-1620812097331-ff6361554882'
      ][(n % 4) + 1]
      when 'Smart Watches' then array[
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a',
        'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1',
        'https://images.unsplash.com/photo-1544117519-31a4b719223d'
      ][(n % 4) + 1]
      else array[
        'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6',
        'https://images.unsplash.com/photo-1616348436168-de43ad0db179',
        'https://images.unsplash.com/photo-1556656793-08538906a9f8',
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e'
      ][(n % 4) + 1]
    end || '?auto=format&fit=crop&w=800&h=800&q=85&demo=' || n::text as image_url
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
