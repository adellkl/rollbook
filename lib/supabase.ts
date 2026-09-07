import { createClient } from '@supabase/supabase-js';

// A publishable key is safe in browser code. Database access is enforced by
// Supabase Auth and the Row Level Security policies in the database.
const url =
  import.meta.env.VITE_SUPABASE_URL ??
  'https://dwjioevckjyycqkjyftr.supabase.co';
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  'sb_publishable_q2diN4xc00-tp0vuuN33UA_hyRnaVKA';

export const supabase = createClient(url, publishableKey);
