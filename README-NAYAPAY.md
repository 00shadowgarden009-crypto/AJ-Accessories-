# AJ ACCERSSORES - Manual NayaPay Checkout

## Supabase setup

1. Open Supabase → SQL Editor.
2. Run `supabase-nayapay.sql` completely.
3. Confirm the `payment-proofs` storage bucket is private.
4. Confirm your owner account has `profiles.role = 'owner'` or that your account email matches `store_settings.owner_email`.
5. Configure the Supabase URL and anon/public key in the site's Owner Portal. Never use a service-role key in the website.

## Test checkout before real customers use it

1. Open the hosted site and sign in as a test customer.
2. Add a product and choose NayaPay.
3. Place a small test order with a transaction reference; optionally attach a JPG, PNG, or WebP screenshot up to 5 MB.
4. Confirm the order is `Awaiting Verification` and not automatically paid.
5. Sign in as owner, view the uploaded proof from the admin orders panel, verify the funds in NayaPay itself, and only then use `Verify & Mark Paid`.
6. Also test COD checkout.

NayaPay details shown at checkout:

- Account title: Muhammad Hamza Shafiq
- Number: 03199061682
- WhatsApp: 03199061682

This is a manual payment workflow, not an automated payment gateway. Customer-submitted references and images are unverified claims until checked in your NayaPay app. The static site/browser app cannot securely validate prices or reserve/decrement inventory against malicious clients; before processing high-value real orders, move order creation and stock updates behind a trusted server/RPC with strict database policies.
