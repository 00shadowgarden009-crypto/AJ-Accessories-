-- AJ Accessories demo catalog: exactly 500 realistic sample accessories.
-- Run in Supabase Dashboard -> SQL Editor after creating the products table.
-- Safe to re-run: only rows branded "AJ Demo Catalog" are replaced.
-- These are fictional demo listings, not real inventory or official brand items.

begin;

delete from public.products
where brand = 'AJ Demo Catalog';

with catalog as (
    select
        n,
        ((n - 1) % 8) + 1 as category_index,
        array[
            'Wireless Earbuds', 'Headphones', 'Speakers', 'Mobile Covers',
            'Fast Chargers', 'Power Banks', 'Smart Watches', 'Screen Protectors'
        ]::text[] as categories,
        array[
            'AirBeat', 'Studio Pulse', 'BassArc', 'FlexShell',
            'VoltForge', 'ChargeCore', 'WristNova', 'ClearShield'
        ]::text[] as ranges,
        array[
            'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=85',
            'https://images.unsplash.com/photo-1502856757208-5b13af1c3e8a?auto=format&fit=crop&w=800&q=85',
            'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=85',
            'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=85',
            'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=85',
            'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=85',
            'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=85',
            'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=85'
        ]::text[] as images
    from generate_series(1, 500) as series(n)
), products as (
    select
        n,
        category_index,
        categories[category_index] as category,
        ranges[category_index] as product_range,
        images[category_index] as image_url,
        case category_index
            when 1 then 3499 + ((n * 137) % 10500)
            when 2 then 4999 + ((n * 173) % 18000)
            when 3 then 2999 + ((n * 211) % 26000)
            when 4 then 799 + ((n * 89) % 4500)
            when 5 then 1199 + ((n * 97) % 9500)
            when 6 then 2499 + ((n * 127) % 12500)
            when 7 then 3999 + ((n * 193) % 22000)
            else 499 + ((n * 53) % 2500)
        end as price,
        case category_index
            when 1 then 'Bluetooth 5.3, clear-call microphones, touch controls and a compact charging case.'
            when 2 then 'Comfort-fit cushions, balanced sound, foldable design and wireless listening for daily use.'
            when 3 then 'Portable wireless audio with rich bass, simple controls and a rechargeable battery.'
            when 4 then 'A slim protective fit with raised camera edges and an easy-grip finish.'
            when 5 then 'Compact USB-C fast charging with built-in temperature and over-current protection.'
            when 6 then 'Portable battery backup with USB-C power delivery and multiple device outputs.'
            when 7 then 'Bright touch display, activity tracking, notification support and an adjustable strap.'
            else 'Tempered-glass screen coverage with smooth touch response and edge-to-edge clarity.'
        end as description
    from catalog
)
insert into public.products (
    name, description, category, brand, price, compare_at_price,
    image_url, stock, is_active, is_featured
)
select
    'AJ ' || product_range || ' ' || lpad(n::text, 3, '0') as name,
    description || ' Demo model ' || lpad(n::text, 3, '0') || '.',
    category,
    'AJ Demo Catalog',
    price,
    round(price * (1.15 + ((n % 4) * 0.05)))::numeric(12,2),
    image_url,
    8 + ((n * 7) % 43),
    true,
    n <= 8
from products;

do $$
begin
    if (select count(*) from public.products where brand = 'AJ Demo Catalog') <> 500 then
        raise exception 'Demo catalog check failed: expected exactly 500 AJ Demo Catalog products.';
    end if;
end;
$$;

commit;

-- Expected result: 500. The website will load these from Supabase once configured.
select count(*) as demo_product_count
from public.products
where brand = 'AJ Demo Catalog';
