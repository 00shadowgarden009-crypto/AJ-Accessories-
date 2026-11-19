-- Run this in the Supabase SQL Editor.
-- Supabase Storage already has RLS enabled on storage.objects; do not ALTER that managed table.

alter table public.orders
  add column if not exists payment_proof_path text;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;

drop policy if exists "Customers upload own payment proofs" on storage.objects;
create policy "Customers upload own payment proofs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Customers view own payment proofs" on storage.objects;
create policy "Customers view own payment proofs"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners view payment proofs" on storage.objects;
create policy "Owners view payment proofs"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'owner'
  )
);
