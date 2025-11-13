# Get Supabase API Keys

We need to get your Supabase API keys to fix the connection.

## Steps:

1. Go to your Supabase project: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb

2. Click on **Settings** (gear icon in left sidebar)

3. Click on **API** in the settings menu

4. You'll see two important keys:
   - **Project URL**: `https://pzkyojrrrvmxasiigrkb.supabase.co` (we already have this)
   - **anon public key**: A long string starting with `eyJ...` - WE NEED THIS
   - **service_role key**: Another long key (keep this secret, more powerful)

5. Copy the **anon public** key

6. Paste it here so I can update the .env file

The anon key is safe to use in client-side code and has Row Level Security (RLS) restrictions.
