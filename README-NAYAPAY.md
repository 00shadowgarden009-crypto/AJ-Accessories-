# AJ ACCERSSORES - Manual NayaPay Checkout

The live entry page is now `index.html`. It loads the existing store and applies a manual NayaPay checkout integration.

Before testing:

1. Open Supabase → SQL Editor.
2. Run `supabase-nayapay.sql`.
3. Confirm the `payment-proofs` private storage bucket exists.
4. Re-enable GitHub Pages or open `index.html` through the repo's web host.

NayaPay payment details shown at checkout:

- Account title: Muhammad Hamza Shafiq
- Number: 03199061682
- WhatsApp: 03199061682

Customers enter a transaction reference and may upload a JPG, PNG, or WebP screenshot up to 5 MB. New NayaPay orders receive `Awaiting Verification` automatically. Payment becomes `Paid` only after the owner verifies the actual NayaPay receipt and uses the existing admin verification control.
