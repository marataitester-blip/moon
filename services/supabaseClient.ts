import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// NOTE: In a real deployment, use environment variables.
// For this generated code to work immediately, you must replace these strings
// or set up process.env variables in your build environment.
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/*
  SQL TO RUN IN SUPABASE SQL EDITOR:

  create table messages (
    id uuid default gen_random_uuid() primary key,
    content text not null,
    sender text not null, -- 'user' or 'ai'
    type text default 'text', -- 'text' or 'image'
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- Enable Realtime
  alter publication supabase_realtime add table messages;
  
  -- Policy (Optional for public demo, strict for prod)
  alter table messages enable row level security;
  create policy "Public access" on messages for all using (true);
*/
