# Add 500 demo products

The file `AJ-Accessories-demo-products.sql` creates exactly 500 fictional accessory listings in the Supabase `public.products` table. Product names, categories, PKR prices, descriptions, stock counts, and image links are varied across earbuds, headphones, speakers, mobile covers, chargers, power banks, watches, and screen protectors.

## Load into Supabase

1. Open your Supabase project and go to **SQL Editor**.
2. Open `AJ-Accessories-demo-products.sql` from this repository, copy its contents, and run it.
3. The final query should return `500`.
4. Configure the website with that same Supabase project so its catalog can load the products.

The script is safe to run again: it replaces only rows whose brand is `AJ Demo Catalog` and leaves other products untouched. These are sample listings, not real stock or verified brand products. The site repository does not contain Supabase credentials, so the SQL must be run in the store owner's Supabase project; it cannot be inserted into the hosted database from GitHub alone.
