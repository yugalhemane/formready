# Connect FormReady to Supabase

The app's account, payment history, entitlements, and owner dashboard use Supabase Auth and Postgres. The app does not upload the user's document files.

## 1. Create the project and database tables

1. Create a Supabase project and keep its database password in a password manager.
2. Open **SQL Editor → New query** and run [`supabase/migrations/202610250001_account_entitlements.sql`](supabase/migrations/202610250001_account_entitlements.sql) in full. It is safe to rerun: it replaces its named RLS policies and recreates its trigger/functions without deleting user or payment rows.
3. In **Project Settings → API**, copy the Project URL and the publishable/anon key. Do not put a secret or service-role key in a `VITE_` variable.

## 2. Configure email sign-in

1. In **Authentication → URL Configuration**, set the Site URL to `https://formready-xi.vercel.app`.
2. Add `https://formready-xi.vercel.app/**` to the allowed redirect URLs. Add `http://localhost:5173/**` for local development and the exact Vercel preview URL patterns you use.
3. In **Authentication → Providers → Email**, enable email sign-in/magic links. Configure a production SMTP provider before opening registration to the public; the default test email service is rate-limited.

## 3. Add Vercel environment variables

Set these for Production (and Preview if needed), then redeploy:

| Variable | Value / use |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase Project URL; browser-side Auth client |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key; safe to expose with the migration's RLS policies |
| `SUPABASE_URL` | Same Project URL; server functions |
| `SUPABASE_ANON_KEY` | Same anon/publishable key; server-side user token validation |
| `SUPABASE_SECRET_KEY` | Supabase secret key (or legacy `SUPABASE_SERVICE_ROLE_KEY`); server only, never prefix with `VITE_` |
| `ADMIN_USER_IDS` | Comma-separated UUID(s) from Supabase Auth for the site owner/admin account(s) |

Copy `.env.example` to `.env.local` for local work and fill the same values there. Never commit `.env.local` or send secret values in chat.

## 4. Confirm the account and access flow

1. Open the deployed site and choose **Sign in**. Submit your email and follow the magic link.
2. In Supabase **Authentication → Users**, copy your account's UUID into `ADMIN_USER_IDS` in Vercel. Redeploy; the `/admin` route is authorized by this UUID, not by an email address supplied by the browser.
3. Confirm the account page loads and that a signed-out plan button sends the visitor to `/account?next=%2Fpricing`. Completing its magic link returns them to pricing.
4. Configure Razorpay and its webhook separately before accepting real payments; Supabase credentials alone do not enable checkout. Use Razorpay Test Mode first.

Keep Supabase secret/service-role credentials only in Vercel server environment settings and local untracked environment files. The browser key is public by design; row-level security in the migration is what prevents users from reading or changing other accounts' records.
