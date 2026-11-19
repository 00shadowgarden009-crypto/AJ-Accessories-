# AJ ACCERSSORES - Manual NayaPay Checkout

## Supabase setup

1. Open Supabase → SQL Editor.
2. Run `supabase-nayapay.sql` completely.
3. Confirm the private `payment-proofs` bucket exists.
4. Confirm your `profiles` table identifies the owner with `role = 'owner'`.
5. Enable Google sign-in separately in Supabase Authentication if required.

## Test checkout

1. Open the website through GitHub Pages or a local web server.
2. Sign in with the customer account.
3. Add a product and select NayaPay.
4. Enter a reference and optionally upload a screenshot.
5. Confirm the order appears as `Awaiting Verification`.
6. Open the owner admin panel.
7. Verify the screenshot and the actual NayaPay transaction.
8. Only then select `Verify & Mark Paid`.

NayaPay details shown at checkout:

- Account title: Muhammad Hamza Shafiq
- Number: 03199061682
- WhatsApp: 03199061682

Screenshots are uploaded only to a private Supabase Storage bucket. NayaPay screenshots do not prove payment automatically.
